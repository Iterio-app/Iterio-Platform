// Script para instalar dependencias adicionales necesarias
const { execSync } = require("child_process")

console.log("Instalando dependencias para el conversor Excel a PDF...")

try {
  // Instalar dependencias principales
  execSync("npm install xlsx puppeteer", { stdio: "inherit" })

  console.log("✅ Dependencias instaladas correctamente")
  console.log("")
  console.log("📋 Dependencias instaladas:")
  console.log("- xlsx: Para leer archivos Excel")
  console.log("- puppeteer: Para generar PDFs desde HTML")
  console.log("")
  console.log("🚀 La aplicación está lista para usar!")
} catch (error) {
  console.error("❌ Error instalando dependencias:", error.message)
  process.exit(1)
}
