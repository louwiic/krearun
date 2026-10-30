export const HALLOWEEN_OFFER = {
  code: "HALLOWEEN5",
  amountCents: 500,
  minimumAmountCents: 4000,
  expiresAt: Date.parse("2026-11-01T23:59:59+04:00") / 1000,
  subject: "Halloween : 5 € offerts dès 40 € chez Kréarun",
  preheader: "Du 30 octobre au 1er novembre, personnalisez vos envies avec le code HALLOWEEN5. Hors frais de port.",
};

export function halloweenNewsletterHtml() {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Un week-end à votre image — Kréarun</title></head>
<body style="margin:0;padding:0;background:#28132e;font-family:Arial,Helvetica,sans-serif;color:#28132e;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${HALLOWEEN_OFFER.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#28132e;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff8ed;">
<tr><td align="center" style="padding:24px 24px 18px;"><a href="https://krearun.re/" style="text-decoration:none;"><img src="https://krearun.re/brand/krearun-wordmark.webp" width="220" alt="Kréarun — la personnalisation à fond !" style="display:block;width:220px;max-width:100%;height:auto;border:0;"></a></td></tr>
<tr><td><img src="https://krearun.re/brand/krearun-hero.webp" width="600" alt="Vos idées. Vos couleurs. Votre style. Les créations personnalisées Kréarun." style="display:block;width:100%;height:auto;border:0;"></td></tr>
<tr><td align="center" style="padding:32px 24px;background:#ff9b46;">
<p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Halloween à l’atelier</p>
<h1 style="margin:0;font-size:34px;line-height:1.12;letter-spacing:-1px;">Un peu de frisson.<br>Une création à votre façon.</h1>
<p style="margin:22px 0 0;font-size:80px;line-height:1;font-weight:800;letter-spacing:-4px;">−5 €</p>
<p style="margin:8px 0 20px;font-size:21px;font-weight:700;">dès 40 € d’achat</p>
<p style="margin:0;font-family:'Courier New',monospace;font-size:13px;">VOTRE CODE</p>
<p style="display:inline-block;margin:10px 0 14px;padding:13px 22px;border:2px dashed #28132e;font-family:'Courier New',monospace;font-size:27px;font-weight:700;letter-spacing:2px;">${HALLOWEEN_OFFER.code}</p>
<p style="margin:0;font-size:14px;line-height:1.6;">Du 30 octobre au 1<sup>er</sup> novembre 2026 inclus.</p>
</td></tr>
<tr><td style="padding:30px 28px 10px;font-size:16px;line-height:1.7;">
<p style="margin:0 0 16px;">Bonjour,</p>
<p style="margin:0 0 16px;">Ce week-end, faites entrer vos idées à l’atelier. Un porte-boisson à votre nom, une lampe personnalisée ou un cadeau à imaginer : choisissez une création qui vous ressemble.</p>
<p style="margin:0;">Pour Halloween, profitez de <strong>5 € de réduction dès 40 € d’articles</strong> avec le code <strong>${HALLOWEEN_OFFER.code}</strong>.</p>
</td></tr>
<tr><td align="center" style="padding:22px 24px 30px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#28132e" style="border-radius:30px;"><a href="https://krearun.re/boutique" style="display:inline-block;padding:17px 27px;color:#fff8ed;text-decoration:none;font-size:15px;font-weight:700;">Je choisis ma création →</a></td></tr></table></td></tr>
<tr><td style="padding:24px 28px;border-top:1px solid #dccbbd;">
<h2 style="margin:0 0 16px;font-size:21px;">Comment en profiter ?</h2>
<p style="margin:0 0 9px;font-size:14px;line-height:1.6;"><strong>01.</strong> Composez votre panier à partir de 40 € d’articles.</p>
<p style="margin:0 0 9px;font-size:14px;line-height:1.6;"><strong>02.</strong> Saisissez <strong>${HALLOWEEN_OFFER.code}</strong> dans le champ « Code promo » du panier.</p>
<p style="margin:0;font-size:14px;line-height:1.6;"><strong>03.</strong> Retrouvez vos 5 € de réduction sur la page de paiement.</p>
</td></tr>
<tr><td style="padding:24px 28px;background:#f2e5d5;font-size:14px;line-height:1.65;"><strong>Fabrication artisanale, à votre image.</strong><br>Les créations de l’atelier demandent 2 à 4 jours de préparation avant expédition.<br>Une question ? <a href="mailto:stdcreativ974@gmail.com" style="color:#28132e;text-decoration:underline;">Écrivez-nous</a>.</td></tr>
<tr><td style="padding:22px 28px;font-size:11px;line-height:1.7;color:#66556a;">Offre valable sur krearun.re du 30 octobre au 1<sup>er</sup> novembre 2026 à 23 h 59, heure de La Réunion. Réduction de 5 € pour un minimum de 40 € d’articles, après remises automatiques et hors frais de port. Un seul code promotionnel par commande. Valable également pour les clients ayant déjà commandé.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
