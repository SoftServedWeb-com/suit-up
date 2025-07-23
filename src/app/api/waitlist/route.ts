import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { waitlistSchema } from "@/lib/waitlist-schema";

// Create JWT client outside the handler function
// This way it's only created once when the file is loaded
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    
    // Validate with Zod schema
    const result = waitlistSchema.safeParse(body);
    
    if (!result.success) {
      // Return validation errors
      return NextResponse.json(
        { 
          message: "Validation error", 
          errors: result.error.flatten().fieldErrors 
        },
        { status: 400 },
      );
    }

    // Extract validated data
    const { email, name } = result.data;

    console.log("Data received in backend:", { email, name });

    // Create transporter - simpler configuration based on React Email example
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.zoho.in",
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return NextResponse.json(
        {
          message: "Email server connection failed",
          error: verifyError instanceof Error ? verifyError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
    
    // Render email templates with name if provided
    const nameDisplay = name ? `Name: ${name}` : 'No name provided';
    
    const adminHtml = `
    <h1>New Waitlist Signup</h1>
    <p>${nameDisplay}</p>
    <p>Email: ${email}</p>
    <p>Time: ${new Date().toLocaleString()}</p>
    `;

    const userGreeting = name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>';
    
    const userHtml = `
    <h1>Welcome to TrialRoom Studio</h1>
    ${userGreeting}
    <p>Thank you for joining our waitlist.</p>
    <p>Our team will be in contact soon!.</p>
    `;

    // Send emails
    try {
      // Send admin notification
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: "softservedweb@gmail.com",
        subject: "New Waitlist Signup - TrialRoom Studio",
        html: adminHtml,
      });

      // Send to user
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to TrialRoom Studio",
        html: userHtml,
      });

      console.log("User confirmation sent");
      
      // Google Sheets integration - with proper error handling
      try {
        // Initialize the sheet - using the JWT client created outside the function
        const doc = new GoogleSpreadsheet(
          process.env.GOOGLE_SHEET_ID || "1YMVxk3_Hkxt8jp4xNSqFPghqlbqGoMFbgv-2u0TrHC0", 
          serviceAccountAuth
        );
        
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        
        // Create the new row data with timestamp and name
        const newRowData = {
          'Email': email,
          'Name': name || '',
          'Signup Date': new Date().toISOString(),
        };
        
        // Add the row directly to the sheet
        await sheet.addRow(newRowData);
        
        console.log("User data added to Google Sheet");
      } catch (sheetError) {
        // Log the error but don't fail the whole request
        console.error("Failed to add to Google Sheet:", sheetError);
        // Continue with the success response as the emails were sent
      }

      return NextResponse.json(
        {
          message: "Successfully joined waitlist",
          success: true,
        },
        { status: 200 },
      );
    } catch (sendError) {
      console.error("Email sending failed:", sendError);
      return NextResponse.json(
        {
          message: "Failed to send emails",
          error: sendError instanceof Error ? sendError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json(
      {
        message: "Failed to process request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}