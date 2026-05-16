/**
 * Script de seed — Pobla la base de datos con datos de prueba.
 * Uso: npx tsx scripts/seed.ts
 *
 * Requiere MONGODB_URI en .env.local
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

// Importar modelos
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    location: { type: String, default: "Pasto, Nariño" },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const ArtworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    technique: { type: String, default: "" },
    dimensions: { type: String, default: "" },
    year: { type: Number },
    tags: [{ type: String }],
    category: { type: String, default: "otro" },
    isPublic: { type: Boolean, default: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
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
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
const Artwork = mongoose.models.Artwork ?? mongoose.model("Artwork", ArtworkSchema);
const Collection = mongoose.models.Collection ?? mongoose.model("Collection", CollectionSchema);

// ── Datos de prueba ──

const USERS = [
  {
    username: "maria_pintora",
    email: "maria@demo.com",
    password: "demo123",
    displayName: "María López",
    bio: "Artista plástica especializada en óleo sobre lienzo. Inspirada por los paisajes de Nariño.",
    location: "Pasto, Nariño",
    plan: "pro" as const,
  },
  {
    username: "carlos_escultor",
    email: "carlos@demo.com",
    password: "demo123",
    displayName: "Carlos Muñoz",
    bio: "Escultor contemporáneo. Trabajo con arcilla, madera y materiales reciclados.",
    location: "Pasto, Nariño",
    plan: "free" as const,
  },
  {
    username: "elena_ilustra",
    email: "elena@demo.com",
    password: "demo123",
    displayName: "Elena Guerrero",
    bio: "Ilustradora digital y tradicional. Dibujo de figura y concept art.",
    location: "Pasto, Nariño",
    plan: "free" as const,
  },
];

const ARTWORKS_PER_USER = [
  // María (pintura)
  [
    { title: "Volcán Galeras al amanecer", technique: "Óleo sobre lienzo", dimensions: "80 x 60 cm", year: 2024, category: "pintura", tags: ["paisaje", "nariño", "galeras"] },
    { title: "Retrato de mi abuela", technique: "Acrílico sobre madera", dimensions: "50 x 40 cm", year: 2023, category: "pintura", tags: ["retrato", "familia"] },
    { title: "Mercado de Bombona", technique: "Acuarela", dimensions: "30 x 40 cm", year: 2024, category: "pintura", tags: ["urbano", "pasto", "mercado"] },
  ],
  // Carlos (escultura)
  [
    { title: "Raíces", technique: "Arcilla cocida", dimensions: "45 x 30 x 30 cm", year: 2024, category: "escultura", tags: ["abstracto", "naturaleza"] },
    { title: "El Barniz de Pasto", technique: "Madera tallada y barniz", dimensions: "60 x 20 x 20 cm", year: 2023, category: "escultura", tags: ["tradicion", "artesania"] },
  ],
  // Elena (ilustración)
  [
    { title: "Guerrera del Carnaval", technique: "Digital (Procreate)", dimensions: "3000 x 4000 px", year: 2024, category: "ilustracion", tags: ["carnaval", "personaje", "fantasy"] },
    { title: "Estudio de manos #42", technique: "Grafito sobre papel", dimensions: "A4", year: 2024, category: "ilustracion", tags: ["estudio", "anatomia", "manos"] },
    { title: "Paisaje imaginario de Cocha", technique: "Digital (Photoshop)", dimensions: "4000 x 2500 px", year: 2023, category: "ilustracion", tags: ["paisaje", "cocha", "fantasy"] },
  ],
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI no está definida en .env.local");
    process.exit(1);
  }

  console.log("🔗 Conectando a MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Conectado.\n");

  // Limpiar colecciones existentes
  console.log("🗑️  Limpiando datos existentes...");
  await User.deleteMany({});
  await Artwork.deleteMany({});
  await Collection.deleteMany({});

  // Crear usuarios
  console.log("👤 Creando usuarios...");
  const createdUsers = [];
  for (const userData of USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await User.create({
      ...userData,
      passwordHash,
    });
    createdUsers.push(user);
    console.log(`   ✓ ${user.username} (${user.plan})`);
  }

  // Crear obras
  console.log("\n🎨 Creando obras...");
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const artworks = ARTWORKS_PER_USER[i];

    for (const artData of artworks) {
      const artwork = await Artwork.create({
        ...artData,
        imageUrl: `https://placehold.co/800x800/1e1c1a/c9a96e?text=${encodeURIComponent(artData.title.slice(0, 15))}`,
        author: user._id,
      });
      console.log(`   ✓ "${artwork.title}" by @${user.username}`);
    }
  }

  // Crear colecciones de ejemplo
  console.log("\n📁 Creando colecciones...");
  await Collection.create({
    name: "Referencias de anatomía",
    description: "Estudios de proporción y gesto para figura humana.",
    owner: createdUsers[2]._id, // Elena
    references: [
      { imageUrl: "https://placehold.co/400x400/1e1c1a/5a534c?text=Ref+1", caption: "Proporción de cabeza" },
      { imageUrl: "https://placehold.co/400x400/1e1c1a/5a534c?text=Ref+2", caption: "Gesto dinámico" },
    ],
  });
  console.log("   ✓ 'Referencias de anatomía' (Elena)");

  await Collection.create({
    name: "Paletas de color Nariño",
    description: "Paletas de color inspiradas en los paisajes de Nariño.",
    owner: createdUsers[0]._id, // María
    references: [
      { imageUrl: "https://placehold.co/400x400/1e1c1a/c9a96e?text=Paleta+1", caption: "Atardecer Galeras" },
    ],
  });
  console.log("   ✓ 'Paletas de color Nariño' (María)");

  console.log("\n✅ Seed completado.");
  console.log(`   ${createdUsers.length} usuarios`);
  console.log(`   ${ARTWORKS_PER_USER.flat().length} obras`);
  console.log(`   2 colecciones`);
  console.log("\n🔑 Credenciales de prueba:");
  for (const u of USERS) {
    console.log(`   ${u.email} / ${u.password}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
