import Promo from "../models/promoModel.js";

// GET /api/promo — public, called by the user-facing website
const getPromo = async (req, res) => {
  try {
    const promo = await Promo.findOne();
    console.log('promo',promo)
    if (!promo) return res.json({ enabled: false });
    res.json(promo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch promo." });
  }
};

// GET /api/admin/promo — load current config into the admin form
const getAdminPromo = async (req, res) => {
  try {
    const promo = await Promo.findOne();
    if (!promo) return res.json({});
    res.json(promo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch promo." });
  }
};

// POST /api/admin/promo — save/update promo config from admin panel
const savePromo = async (req, res) => {
  try {
    const { enabled, title, description, ctaText, ctaLink, emoji, delaySeconds, colorFrom, colorTo } = req.body;

    // upsert: true  → creates the doc if none exists yet
    // new: true     → returns the updated doc
    const promo = await Promo.findOneAndUpdate(
      {},
      { enabled, title, description, ctaText, ctaLink, emoji, delaySeconds, colorFrom, colorTo },
      { upsert: true, new: true }
    );

    res.json({ success: true, promo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save promo." });
  }
};

export { getPromo, getAdminPromo, savePromo };