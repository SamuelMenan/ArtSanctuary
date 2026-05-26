/**
 * Seed — pobla DB con usuarios + obras + colecciones con metadata completa.
 * Uso: npx tsx scripts/seed.ts
 * Requiere MONGODB_URI en .env.local
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

/* ── Schemas (compatibles con models/ reales) ── */

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    location: { type: String, default: "Pasto, Nariño" },
    website: { type: String, default: "" },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, strict: false }
);

const ArtworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadDate: { type: Date, default: Date.now },
    creationDate: {
      type: { type: String, enum: ["exact", "year", "monthyear", "range", "approx"] },
      value: String,
      certainty: { type: String, enum: ["confirmed", "estimated", "desconocida"] },
    },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["pintura", "escultura", "ilustracion", "fotografia", "otro"],
      default: "otro",
    },
    medium: String,
    technique: String,
    materials: [String],
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, enum: ["cm", "in", "px", "mm"] },
    },
    signature: { type: Boolean, default: false },
    visibility: { type: String, enum: ["public", "unlisted", "private"], default: "public" },
    altText: String,
    licenseRights: {
      copyrightHolder: String,
      licenseType: { type: String, enum: ["all-rights-reserved", "cc-by", "cc-by-nc"] },
    },
    tags: [String],
    imageUrl: { type: String, required: true },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        userAvatar: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, strict: false }
);

const CollectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    isPrivate: { type: Boolean, default: false },
    references: [
      {
        imageUrl: { type: String, required: true },
        caption: { type: String, default: "" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, strict: false }
);

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
const Artwork = mongoose.models.Artwork ?? mongoose.model("Artwork", ArtworkSchema);
const Collection = mongoose.models.Collection ?? mongoose.model("Collection", CollectionSchema);

/* ── Datos ── */

const USERS = [
  {
    username: "maria_pintora",
    email: "maria@demo.com",
    password: "demo123",
    displayName: "María López",
    bio: "Artista plástica. Óleo y acrílico. Paisajes y retratos de Nariño.",
    avatarUrl: "https://picsum.photos/seed/maria-avatar/200/200",
    location: "Pasto, Nariño",
    website: "https://marialopez.art",
    plan: "pro" as const,
  },
  {
    username: "carlos_escultor",
    email: "carlos@demo.com",
    password: "demo123",
    displayName: "Carlos Muñoz",
    bio: "Escultor contemporáneo. Arcilla, madera, materiales reciclados.",
    avatarUrl: "https://picsum.photos/seed/carlos-avatar/200/200",
    location: "Pasto, Nariño",
    website: "",
    plan: "free" as const,
  },
  {
    username: "elena_ilustra",
    email: "elena@demo.com",
    password: "demo123",
    displayName: "Elena Guerrero",
    bio: "Ilustradora digital y tradicional. Concept art y figura.",
    avatarUrl: "https://picsum.photos/seed/elena-avatar/200/200",
    location: "Pasto, Nariño",
    website: "https://elenaguerrero.com",
    plan: "free" as const,
  },
];

const LOREM = [
  "Obra inspirada en los paisajes andinos del sur de Colombia. Trabajo de luz y atmósfera.",
  "Estudio cromático con énfasis en contrastes fríos y tonos tierra. Proceso de tres meses.",
  "Pieza que explora la memoria del territorio y los oficios artesanales heredados.",
  "Composición geométrica con base en proporción áurea. Capas de pigmento aplicadas sucesivamente.",
  "Reflexión sobre identidad y raíces. Material trabajado a mano con técnica tradicional.",
  "Serie sobre el carnaval de Negros y Blancos. Vibración cromática y movimiento.",
  "Pieza experimental con materiales locales. Diálogo entre lo orgánico y lo industrial.",
  "Retrato íntimo construido a partir de fotografías familiares. Atmósfera melancólica.",
  "Boceto desarrollado del natural durante residencia en zona rural. Estudio de gesto.",
  "Composición narrativa que aborda mitos populares del altiplano nariñense.",
];

const MARIA_ARTWORKS = [
  { title: "Volcán Galeras al amanecer", medium: "Óleo sobre lienzo", technique: "Pincel y espátula", materials: ["óleo", "lienzo", "barniz"], dim: [80, 60], year: "2024", tags: ["paisaje", "nariño", "galeras", "amanecer"] },
  { title: "Retrato de mi abuela", medium: "Acrílico sobre madera", technique: "Veladura", materials: ["acrílico", "madera"], dim: [50, 40], year: "2023", tags: ["retrato", "familia"] },
  { title: "Mercado de Bombona", medium: "Acuarela sobre papel", technique: "Húmedo sobre húmedo", materials: ["acuarela", "papel arches"], dim: [30, 40], year: "2024", tags: ["urbano", "pasto", "mercado"] },
  { title: "Laguna de la Cocha", medium: "Óleo sobre lienzo", technique: "Empaste", materials: ["óleo", "lienzo"], dim: [100, 70], year: "2023", tags: ["paisaje", "cocha", "agua"] },
  { title: "Mujeres del páramo", medium: "Acrílico sobre lienzo", technique: "Pincel seco", materials: ["acrílico", "lienzo"], dim: [120, 90], year: "2024", tags: ["figura", "páramo", "mujer"] },
  { title: "Estudio de luz #7", medium: "Óleo sobre tabla", technique: "Alla prima", materials: ["óleo", "tabla preparada"], dim: [30, 30], year: "2024", tags: ["estudio", "luz"] },
  { title: "Patio del taller", medium: "Acuarela sobre papel", technique: "Lavado plano", materials: ["acuarela", "papel"], dim: [25, 35], year: "2023", tags: ["interior", "taller"] },
  { title: "Atardecer en San Juan", medium: "Óleo sobre lienzo", technique: "Veladuras", materials: ["óleo", "lienzo"], dim: [90, 60], year: "2022", tags: ["paisaje", "atardecer"] },
  { title: "Naturaleza muerta con frutas", medium: "Óleo sobre lienzo", technique: "Empaste", materials: ["óleo", "lienzo"], dim: [50, 60], year: "2024", tags: ["bodegón", "frutas"] },
  { title: "Calle del Centro Histórico", medium: "Acrílico sobre cartón", technique: "Pincel y rodillo", materials: ["acrílico", "cartón"], dim: [40, 30], year: "2023", tags: ["urbano", "pasto"] },
];

const CARLOS_ARTWORKS = [
  { title: "Raíces", medium: "Arcilla cocida", technique: "Modelado a mano", materials: ["arcilla", "engobe"], dim: [45, 30, 30], year: "2024", tags: ["abstracto", "naturaleza", "raíz"] },
  { title: "El Barniz de Pasto", medium: "Madera tallada", technique: "Tallado y barniz mopa-mopa", materials: ["madera", "barniz mopa-mopa"], dim: [60, 20, 20], year: "2023", tags: ["tradición", "artesanía"] },
  { title: "Torre del olvido", medium: "Materiales reciclados", technique: "Ensamblaje", materials: ["metal", "madera reciclada", "alambre"], dim: [120, 30, 30], year: "2024", tags: ["reciclaje", "torre"] },
  { title: "Cabeza dormida", medium: "Bronce", technique: "Fundición a la cera perdida", materials: ["bronce"], dim: [25, 20, 30], year: "2023", tags: ["figura", "cabeza", "bronce"] },
  { title: "Semilla", medium: "Mármol blanco", technique: "Tallado directo", materials: ["mármol"], dim: [40, 30, 30], year: "2022", tags: ["mármol", "abstracto"] },
  { title: "Volar sin alas", medium: "Acero corten", technique: "Soldadura y oxidación controlada", materials: ["acero corten"], dim: [180, 60, 60], year: "2024", tags: ["acero", "monumental"] },
  { title: "Memoria del campo", medium: "Madera y cuerda", technique: "Ensamblaje", materials: ["madera de eucalipto", "cuerda de fique"], dim: [80, 50, 40], year: "2023", tags: ["memoria", "campo"] },
  { title: "Vasija ceremonial", medium: "Arcilla negra", technique: "Modelado y bruñido", materials: ["arcilla negra"], dim: [35, 25, 25], year: "2024", tags: ["cerámica", "ritual"] },
];

const ELENA_ARTWORKS = [
  { title: "Guerrera del Carnaval", medium: "Digital (Procreate)", technique: "Vectorial y raster", materials: ["digital"], dim: [3000, 4000], unit: "px", year: "2024", tags: ["carnaval", "personaje", "fantasy"] },
  { title: "Estudio de manos #42", medium: "Grafito sobre papel", technique: "Lápiz 2B y 4B", materials: ["grafito", "papel"], dim: [21, 29.7], year: "2024", tags: ["estudio", "anatomía", "manos"] },
  { title: "Paisaje imaginario de Cocha", medium: "Digital (Photoshop)", technique: "Mate painting", materials: ["digital"], dim: [4000, 2500], unit: "px", year: "2023", tags: ["paisaje", "cocha", "fantasy"] },
  { title: "Concept art — Ciudad flotante", medium: "Digital", technique: "Raster", materials: ["digital"], dim: [3840, 2160], unit: "px", year: "2024", tags: ["concept", "ciudad", "scifi"] },
  { title: "Retrato veloz #12", medium: "Tinta china sobre papel", technique: "Pincel y plumilla", materials: ["tinta", "papel"], dim: [30, 40], year: "2024", tags: ["retrato", "tinta"] },
  { title: "Personaje — La cazadora", medium: "Digital (Procreate)", technique: "Render limpio", materials: ["digital"], dim: [2500, 3500], unit: "px", year: "2024", tags: ["personaje", "fantasy"] },
  { title: "Bocetos de gesto", medium: "Sanguina sobre papel", technique: "Línea suelta", materials: ["sanguina", "papel"], dim: [29.7, 42], year: "2023", tags: ["gesto", "figura"] },
  { title: "Diosa del maíz", medium: "Acuarela y tinta", technique: "Mixta", materials: ["acuarela", "tinta"], dim: [40, 50], year: "2023", tags: ["mitología", "maíz"] },
  { title: "Studio illustration — Mercado", medium: "Digital", technique: "Color flats + sombras", materials: ["digital"], dim: [3000, 2000], unit: "px", year: "2024", tags: ["mercado", "ilustración"] },
];

function pickLicense(i: number): "all-rights-reserved" | "cc-by" | "cc-by-nc" {
  return (["all-rights-reserved", "cc-by-nc", "cc-by"] as const)[i % 3];
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildArtwork(
  data: any,
  index: number,
  user: { _id: any; displayName: string }
) {
  const dimUnit = data.unit || "cm";
  const [w, h, d] = data.dim;
  const description = LOREM[index % LOREM.length];

  return {
    title: data.title,
    artistId: user._id,
    creationDate: {
      type: "year",
      value: data.year,
      certainty: "confirmed",
    },
    description,
    category: data.category,
    medium: data.medium,
    technique: data.technique,
    materials: data.materials,
    dimensions: { width: w, height: h, depth: d, unit: dimUnit },
    signature: index % 2 === 0,
    visibility: "public",
    altText: `${data.title} — ${data.medium}`,
    licenseRights: {
      copyrightHolder: user.displayName,
      licenseType: pickLicense(index),
    },
    tags: data.tags,
    imageUrl: (() => {
      const ratios = [
        [600, 800], [800, 600], [600, 900], [900, 600],
        [800, 800], [700, 1050], [1050, 700], [600, 1000],
      ];
      const [iw, ih] = ratios[index % ratios.length];
      return `https://picsum.photos/seed/${slug(data.title)}/${iw}/${ih}`;
    })(),
    likes: Math.floor(Math.random() * 80),
    views: Math.floor(Math.random() * 500) + 50,
  };
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI no está definida en .env.local");
    process.exit(1);
  }

  console.log("🔗 Conectando a MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Conectado.\n");

  console.log("🗑️  Limpiando datos previos...");
  await User.deleteMany({});
  await Artwork.deleteMany({});
  await Collection.deleteMany({});

  console.log("👤 Creando usuarios...");
  const createdUsers: any[] = [];
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await User.create({ ...u, passwordHash });
    createdUsers.push(user);
    console.log(`   ✓ @${user.username}`);
  }

  // Follow cruzado: todos siguen a todos
  for (const u of createdUsers) {
    u.following = createdUsers.filter(x => x._id.toString() !== u._id.toString()).map(x => x._id);
    u.followers = u.following;
    await u.save();
  }

  const categories: Array<"pintura" | "escultura" | "ilustracion"> = ["pintura", "escultura", "ilustracion"];
  const sets = [MARIA_ARTWORKS, CARLOS_ARTWORKS, ELENA_ARTWORKS];

  console.log("\n🎨 Creando obras...");
  const allArtworks: any[] = [];
  for (let ui = 0; ui < createdUsers.length; ui++) {
    const user = createdUsers[ui];
    const set = sets[ui].map(a => ({ ...a, category: categories[ui] }));
    for (let i = 0; i < set.length; i++) {
      const art = await Artwork.create(buildArtwork(set[i], i, user));
      allArtworks.push(art);
      console.log(`   ✓ "${art.title}" — @${user.username}`);
    }
  }

  // Likes cruzados
  console.log("\n❤️  Sembrando likes...");
  for (const art of allArtworks) {
    const others = createdUsers.filter(u => u._id.toString() !== art.artistId.toString());
    const likers = others.slice(0, Math.floor(Math.random() * others.length) + 1);
    art.likedBy = likers.map(u => u._id);
    art.likes = likers.length + Math.floor(Math.random() * 30);
    await art.save();
  }

  // Comentarios sample
  console.log("\n💬 Sembrando comentarios...");
  const SAMPLE_COMMENTS = [
    "Excelente trabajo, la atmósfera es impresionante.",
    "Me encanta el manejo del color.",
    "La composición está muy lograda.",
    "Hermosa pieza, felicidades.",
    "El detalle en la textura es notable.",
  ];
  for (const art of allArtworks.slice(0, 15)) {
    const commenter = createdUsers.find(u => u._id.toString() !== art.artistId.toString());
    if (!commenter) continue;
    art.comments = [
      {
        userId: commenter._id,
        userName: commenter.displayName,
        userAvatar: commenter.avatarUrl,
        text: SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)],
        createdAt: new Date(),
      },
    ];
    await art.save();
  }

  // Colecciones
  console.log("\n📁 Creando colecciones...");
  await Collection.create({
    name: "Referencias de anatomía",
    description: "Estudios de proporción y gesto para figura humana.",
    owner: createdUsers[2]._id,
    references: [
      { imageUrl: "https://picsum.photos/seed/ref-anatomy-1/400/400", caption: "Proporción de cabeza" },
      { imageUrl: "https://picsum.photos/seed/ref-anatomy-2/400/400", caption: "Gesto dinámico" },
      { imageUrl: "https://picsum.photos/seed/ref-anatomy-3/400/400", caption: "Manos en escorzo" },
    ],
    artworks: allArtworks.filter(a => a.category === "ilustracion").slice(0, 3).map(a => a._id),
  });

  await Collection.create({
    name: "Paletas de color Nariño",
    description: "Paletas inspiradas en paisajes locales.",
    owner: createdUsers[0]._id,
    references: [
      { imageUrl: "https://picsum.photos/seed/palette-1/400/400", caption: "Atardecer Galeras" },
      { imageUrl: "https://picsum.photos/seed/palette-2/400/400", caption: "Laguna Cocha" },
    ],
    artworks: allArtworks.filter(a => a.category === "pintura").slice(0, 4).map(a => a._id),
  });

  await Collection.create({
    name: "Inspiración escultórica",
    description: "Referencias de forma y volumen.",
    owner: createdUsers[1]._id,
    references: [
      { imageUrl: "https://picsum.photos/seed/sculpt-ref-1/400/400", caption: "Volumen orgánico" },
    ],
    artworks: allArtworks.filter(a => a.category === "escultura").map(a => a._id),
  });

  console.log("\n✅ Seed completado.");
  console.log(`   ${createdUsers.length} usuarios`);
  console.log(`   ${allArtworks.length} obras`);
  console.log(`   3 colecciones\n`);
  console.log("🔑 Credenciales:");
  for (const u of USERS) console.log(`   ${u.email} / ${u.password}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
