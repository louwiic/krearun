# Retouches des six lunettes

Outil : imagegen intégré, une retouche par photo source, le 17 octobre 2026.
Sources : `public/products/lunettes/{modele}.webp`, conservées sans modification.
Livrables : `public/products/lunettes/{modele}-studio.webp`.
Masters PNG : `outputs/lunettes-retouches/{modele}.png` (copiés dans le projet).

Modèles : ecaille-bourbon, retro-moka, ecaille-sunset, ovale-minuit,
carree-eclipse, cristal-lagon.

## Prompt utilisé pour chaque modèle

Use case: precise-object-edit. Edit target: the supplied photograph of the real sunglasses {modele}, for its existing Krearun online store listing. Retouch this exact pair into a professional but natural ecommerce photograph. Preserve its exact frame silhouette, proportions, thickness, bridge, hinges, tortoiseshell pattern if present, lens shape, lens tint and transparency. Do not redesign or beautify the actual product. Remove the room, wood table, plant and fingers if present, including their reflections in the lenses. Place the SAME sunglasses on a seamless warm off-white studio backdrop (#f6f2eb) with a subtle realistic soft contact shadow. Straighten the pair to horizontal, center it within a square photograph, entire product visible with approximately 10% clear margin at each side, product occupying roughly 80% of image width. Keep the existing frontal viewpoint and authentic arm geometry. Clean dust and harsh distracting reflections while retaining gentle realistic glossy highlights and subtle lens reflections. For transparent frame maintain true clear transparency; do not tint the frame. Natural softbox illumination, crisp product edges, accurate color. No added logos, branding, text, props, decorative objects or watermark. Return ONE square final product photograph, no collage, no before-after.

## Publication

`node --env-file=.env scripts/update-lunettes-photos.mjs --apply`

Le script charge les visuels sur R2 avec des clés contenant leur empreinte,
remplace uniquement le champ images et conserve la photo d’origine en deuxième
position. Il ne modifie ni le stock ni les prix. Les valeurs précédentes sont
sauvegardées dans `outputs/lunettes-photos-*/before.json`.
