
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

interface TestEmailRequest {
  adminEmail: string;
  isTest?: boolean;
}

interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
    created_at: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-admin-notification function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));
    
    // Handle test email request
    if ('adminEmail' in payload && payload.isTest) {
      console.log("Sending test admin notification email");
      
      const emailResponse = await resend.emails.send({
        from: "PapaFit X3 <onboarding@resend.dev>",
        to: [payload.adminEmail],
        subject: "🧪 Test: New PapaFit X3 User Signup Notification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626; text-align: center; margin-bottom: 20px;">🧪 TEST NOTIFICATION</h1>
              <h2 style="color: #3B82F6; text-align: center;">New PapaFit X3 User Signup! 🏋️‍♂️</h2>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">User Details:</h3>
                <p><strong>Email:</strong> test.user@example.com</p>
                <p><strong>Full Name:</strong> Test User</p>
                <p><strong>Signup Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>User ID:</strong> test-user-id-12345</p>
              </div>
              
              <div style="background: linear-gradient(45deg, #3B82F6, #8B5CF6); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: white;">🎯 Quick Stats</h3>
                <p style="margin: 5px 0; color: white;">This is your <strong>TEST</strong> user notification</p>
                <p style="margin: 5px 0; color: white;">Ready to track their X3 journey!</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://lovable.dev" style="background: linear-gradient(45deg, #3B82F6, #8B5CF6); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                  View Admin Dashboard
                </a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                This is a test notification for new PapaFit X3 signups. In production, this will be sent whenever a real user creates an account.
              </p>
            </div>
          </div>
        `,
      });

      console.log("Test email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: "Test email sent", emailResponse }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Handle auth hook payload (new user signup)
    if ('user' in payload) {
      const authPayload = payload as AuthHookPayload;
      const user = authPayload.user;
      const email = user.email;
      const fullName = user.raw_user_meta_data?.full_name || 'Unknown User';
      const signupDate = new Date(user.created_at).toLocaleString();

      console.log(`Sending admin notification for new user: ${email}`);

      // Use a more appropriate admin email - you should update this with your actual admin email
      const adminEmail = "admin@papafit.com"; // Update this with your actual admin email

      const emailResponse = await resend.emails.send({
        from: "PapaFit X3 <onboarding@resend.dev>",
        to: [adminEmail],
        subject: "🚨 New PapaFit X3 User Signup!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #16a34a; text-align: center;">New PapaFit X3 User Signup! 🏋️‍♂️</h1>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">User Details:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Full Name:</strong> ${fullName}</p>
                <p><strong>Signup Date:</strong> ${signupDate}</p>
                <p><strong>User ID:</strong> ${user.id}</p>
              </div>
              
              <div style="background: linear-gradient(45deg, #3B82F6, #8B5CF6); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: white;">🎯 Welcome to the PapaFit Family!</h3>
                <p style="margin: 5px 0; color: white;">Another fitness enthusiast has joined the X3 revolution</p>
                <p style="margin: 5px 0; color: white;">Ready to track their variable resistance training!</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://lovable.dev" style="background: linear-gradient(45deg, #3B82F6, #8B5CF6); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                  View Admin Dashboard
                </a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                This notification was sent because a new user signed up for PapaFit X3.
              </p>
            </div>
          </div>
        `,
      });

      console.log("Admin notification email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailResponse }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Unknown payload format, skipping notification");
    return new Response(
      JSON.stringify({ success: true, message: "Unknown payload format" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
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
