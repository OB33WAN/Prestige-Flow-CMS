window.PrestigeFlowConfig = {
  "reviews": {
    "google": {
      "endpoint": "",
      "profileUrl": "https://g.page/r/CWoooDggCsiQEBE",
      "refreshMs": 3600000,
      "provider": "custom-json"
    }
  },
  "stripe": {
    "publishableKey": "REPLACE_ME_STRIPE_PUBLISHABLE_KEY",
    "secretKeyNotice": "Do not place STRIPE_SECRET_KEY in static files. Use Stripe Payment Links or a secure backend.",
    "paymentLinks": {
      "default": "REPLACE_ME_STRIPE_PAYMENT_LINK_DEFAULT",
      "drainage": "",
      "emergency-drainage": "",
      "plumbing": "",
      "cctv-survey": ""
    }
  }
};
