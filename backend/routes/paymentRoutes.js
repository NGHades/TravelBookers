import express from "express";
import Stripe from "stripe";

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn(
    "[Stripe] STRIPE_SECRET_KEY is not set. Payment routes will not work until it is configured."
  );
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Create a Stripe Checkout Session for a rental
router.post("/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      message: "Stripe is not configured on the server",
    });
  }

  try {
    const {
      amount,
      currency = "usd",
      description,
      successUrl,
      cancelUrl,
      metadata = {},
    } = req.body;

    if (!amount || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: "amount, successUrl, and cancelUrl are required",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description || "Vehicle rental",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating Stripe Checkout Session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
    });
  }
});

export default router;


