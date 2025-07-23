"use client";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { getTodaysColor } from "@/lib/colors-switch";

export function WaitingList({}) {
  const [submitted, setSubmitted] = useState(false);
  const todaysColor = getTodaysColor();

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          name: "TrialRoom Studio",
        }),
      });

      setSubmitted(true);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Waitlist if full. Please try again later.");
      }
      toast.success("You've been added to the waiting list.");
    } catch (error) {
      toast.error("Waitlist Full. Please try again later.");
    }
  };

  return (
    <form
      className={`text-white flex w-full flex-row gap-2 items-center py-2`}
      action={handleSubmit}
    >
      <Input
        placeholder="Enter your email"
        name="email"
        type="email"
        required
        disabled={submitted}
        className="text-16 placeholder:text-16 text-primary font-semibold placeholder:font-medium placeholder:opacity-60 bg-sky-50 backdrop-blur-sm"
        style={
          {
            borderColor: todaysColor,
            "--placeholder-color": todaysColor,
          } as React.CSSProperties & { "--placeholder-color": string }
        }
      />
      <Submit submitted={submitted} todaysColor={todaysColor} />
    </form>
  );
}

function Submit({
  submitted,
  todaysColor,
}: {
  submitted: boolean;
  todaysColor: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={`w-fit text-16 text-white font-semibold transition-all duration-200 hover:opacity-80`}
      disabled={pending || submitted}
      type={"submit"}
      style={{
        backgroundColor: todaysColor,
        borderColor: todaysColor,
      }}
    >
      {pending ? "Submitting.." : submitted ? "Joined" : "Join the waitlist"}
    </Button>
  );
}
