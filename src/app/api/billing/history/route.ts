import { dodopayments } from "@/lib/dodo-payments";

export async function GET() {
    const payments = await dodopayments.payments.list();
    return new Response(JSON.stringify(payments));
}