
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: any;
  schema: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-welcome-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Check if this is a user signup event
    if (payload.type === 'INSERT' && payload.table === 'users') {
      const user = payload.record;
      const email = user.email;
      const fullName = user.raw_user_meta_data?.full_name || 'PapaFit Member';

      console.log(`Sending welcome email to: ${email}`);

      const emailResponse = await resend.emails.send({
        from: "PapaFit X3 <onboarding@mail.papafit.app>",
        to: [email],
        subject: "Welcome to PapaFit X3! 🏋️‍♂️",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #3B82F6; text-align: center;">Welcome to PapaFit X3! 🏋️‍♂️</h1>
            
            <p>Hi ${fullName},</p>
            
            <p>Welcome to PapaFit X3 - your ultimate variable resistance training tracker!</p>
            
            <p>You're now ready to:</p>
            <ul>
              <li>📊 Track your X3 workouts with precision</li>
              <li>💪 Monitor your strength progression</li>
              <li>🎯 Follow the proven X3 protocol</li>
              <li>🚀 Build strength and muscle efficiently</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://lovable.dev" style="background: linear-gradient(45deg, #3B82F6, #8B5CF6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Start Your First Workout
              </a>
            </div>
            
            <p>Ready to transform your physique with variable resistance training? Let's get started!</p>
            
            <p>Best regards,<br>
            The PapaFit X3 Team</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              This email was sent because you signed up for PapaFit X3. If you didn't sign up, please ignore this email.
            </p>
          </div>
        `,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailResponse }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Not a user signup event, skipping email");
    return new Response(
      JSON.stringify({ success: true, message: "Not a signup event" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
