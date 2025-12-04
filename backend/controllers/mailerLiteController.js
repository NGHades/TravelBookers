import dotenv from "dotenv";

dotenv.config();

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_API_BASE = "https://connect.mailerlite.com/api";

export const subscribeToMailerLite = async (req, res) => {
  try {
    if (!MAILERLITE_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "MailerLite API key is not configured on the server.",
      });
    }

    const { email, name, group_id } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    const payload = {
      email,
    };

    if (name && typeof name === "string") {
      payload.name = name;
    }

    if (group_id) {
      payload.groups = [group_id];
    }

    const mlResponse = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await mlResponse.json().catch(() => null);

    if (!mlResponse.ok) {
      const status = mlResponse.status || 500;
      const detail =
        (data && (data.message || data.error || data.detail)) ||
        "Failed to subscribe in MailerLite.";

      return res.status(status).json({
        success: false,
        message: detail,
      });
    }

    return res.status(200).json({
      success: true,
      message: "You have been subscribed successfully.",
      data,
    });
  } catch (error) {
    console.error("Error subscribing to MailerLite:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while subscribing.",
    });
  }
};


