"use client"

import React from "react"
import { useRef } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface PdfGeneratorProps {
  data: any
  template: any
  onComplete?: (success: boolean, error?: string) => void
}

export default function PdfGenerator({ data, template, onComplete }: PdfGeneratorProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const preloadImages = async (imageSrcs: string[]): Promise<void> => {
    const imagePromises = imageSrcs.map((src) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve()
        img.onerror = () => resolve() // Continuar aunque falle una imagen
        img.src = src
      })
    })

    await Promise.all(imagePromises)
  }

  const generatePDF = async () => {
    if (!contentRef.current) return

    try {
      // Recopilar todas las URLs de imágenes
      const allImages: string[] = []

      // Agregar logo
      if (template.logo) {
        allImages.push(template.logo)
      }

      // Agregar imágenes de vuelos
      data.vuelos?.forEach((vuelo: any) => {
        if (vuelo.imagenes) {
          allImages.push(...vuelo.imagenes)
        }
      })

      // Agregar imágenes de hoteles
      data.hoteles?.forEach((hotel: any) => {
        if (hotel.imagenes) {
          allImages.push(...hotel.imagenes)
        }
      })

      // Agregar imágenes de traslados
      data.traslados?.forEach((traslado: any) => {
        if (traslado.imagenes) {
          allImages.push(...traslado.imagenes)
        }
      })

      // Agregar imágenes de servicios
      data.actividades?.forEach((servicio: any) => {
        if (servicio.imagenes) {
          allImages.push(...servicio.imagenes)
        }
      })

      // Precargar todas las imágenes
      await preloadImages(allImages)

      // Esperar un poco más para que se rendericen
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Configurar opciones para html2canvas con alta calidad
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Mayor escala para mejor calidad de texto
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 15000, // Más tiempo para cargar imágenes
        removeContainer: true,
      })

      const imgData = canvas.toDataURL("image/png", 1.0) // Máxima calidad

      // Crear PDF con márgenes reducidos
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Márgenes más pequeños: 8mm
      const margin = 8
      const contentWidth = pdfWidth - margin * 2
      const contentHeight = pdfHeight - margin * 2

      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calcular ratio manteniendo proporciones exactas
      const ratio = contentWidth / imgWidth
      const scaledHeight = imgHeight * ratio

      // Si el contenido cabe en una página
      if (scaledHeight <= contentHeight) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, scaledHeight)
      } else {
        // Dividir en múltiples páginas
        const pageHeight = contentHeight
        const totalPages = Math.ceil(scaledHeight / pageHeight)

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage()
          }

          // Calcular la porción exacta de la imagen para esta página
          const sourceY = (i * pageHeight) / ratio
          const sourceHeight = Math.min(pageHeight / ratio, imgHeight - sourceY)

          if (sourceHeight > 0) {
            // Crear canvas temporal para esta página
            const pageCanvas = document.createElement("canvas")
            const pageCtx = pageCanvas.getContext("2d")

            if (pageCtx) {
              pageCanvas.width = imgWidth
              pageCanvas.height = sourceHeight

              // Dibujar la porción correspondiente sin distorsión
              pageCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)

              const pageImgData = pageCanvas.toDataURL("image/png", 1.0)
              const pageScaledHeight = sourceHeight * ratio

              pdf.addImage(pageImgData, "PNG", margin, margin, contentWidth, pageScaledHeight)
            }
          }
        }
      }

      // Descargar el PDF
      const fileName = `cotizacion-${data.destino?.pais || "viaje"}-${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)

      if (onComplete) onComplete(true)
    } catch (error) {
      console.error("Error generating PDF:", error)
      if (onComplete) onComplete(false, "Error al generar el PDF")
    }
  }

  // Ejecutar la generación automáticamente
  React.useEffect(() => {
    const timer = setTimeout(() => {
      generatePDF()
    }, 2000) // Más tiempo para renderizado completo

    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number, currency = "USD") => {
    // Para todas las monedas, mostrar el código antes del número
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
    return `${currency} ${formattedNumber}`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("es-ES")
    } catch {
      return dateStr
    }
  }

  const getMonthsDisplay = (meses: string[]) => {
    if (!meses || meses.length === 0) return ""

    const monthsData = {
      "01": "Enero",
      "02": "Febrero",
      "03": "Marzo",
      "04": "Abril",
      "05": "Mayo",
      "06": "Junio",
      "07": "Julio",
      "08": "Agosto",
      "09": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre",
    }

    if (meses.length === 1) {
      return monthsData[meses[0]] || ""
    }

    const sortedMonths = [...meses].sort()
    const firstMonth = monthsData[sortedMonths[0]]
    const lastMonth = monthsData[sortedMonths[sortedMonths.length - 1]]

    const firstIndex = Object.keys(monthsData).indexOf(sortedMonths[0])
    const lastIndex = Object.keys(monthsData).indexOf(sortedMonths[sortedMonths.length - 1])
    const expectedLength = lastIndex - firstIndex + 1

    if (sortedMonths.length === expectedLength) {
      return `${firstMonth} - ${lastMonth}`
    } else {
      return sortedMonths.map((m) => monthsData[m]).join(", ")
    }
  }

  const getTipoTarifaLabel = (tipoTarifa: string) => {
    const tipos = {
      economy: "Economy",
      premium_economy: "Premium Economy",
      business: "Business",
      primera_clase: "Primera Clase",
    }
    return tipos[tipoTarifa] || ""
  }

  const getRegimenLabel = (regimen: string) => {
    const regimenes = {
      sin_desayuno: "Sin desayuno",
      desayuno: "Desayuno",
      media_pension: "Media pensión",
      pension_completa: "Pensión completa",
      all_inclusive: "All inclusive",
    }
    return regimenes[regimen] || regimen
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Generando PDF...</p>
        <p className="text-sm text-gray-600 mt-2">Cargando imágenes y optimizando calidad...</p>
      </div>

      <div
        ref={contentRef}
        className="absolute left-[-9999px] top-0"
        style={{
          width: "210mm", // Ancho A4 exacto
          minHeight: "297mm", // Alto A4 exacto
          fontFamily: template.fontFamily,
          fontSize: "14px", // Texto más grande para mejor legibilidad
          lineHeight: "1.5",
          color: "#333",
          backgroundColor: "white",
          padding: "12mm", // Padding reducido
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderTop: `4px solid ${template.primaryColor}`,
            paddingBottom: "12px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          {template.logo && (
            <img
              src={template.logo || "/placeholder.svg"}
              alt="Logo"
              crossOrigin="anonymous"
              style={{
                maxHeight: "80px", // Aumentado de 50px a 80px
                maxWidth: "250px", // Aumentado de 180px a 250px
                margin: "12px auto", // Aumentado el margen
                objectFit: "contain",
                display: "block",
              }}
            />
          )}
        </div>

        {/* Destino */}
        {data.destino && (data.destino.pais || data.destino.ciudad || data.destino.año) && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                textAlign: "center",
                padding: "12px",
                background: `linear-gradient(135deg, ${template.primaryColor}15, ${template.primaryColor}05)`,
                borderRadius: "6px",
                border: `2px solid ${template.primaryColor}`,
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  color: template.primaryColor,
                  fontSize: "22px",
                  fontWeight: "bold",
                  marginBottom: "4px",
                  margin: "0",
                }}
              >
                {data.destino.pais}
                {data.destino.ciudad ? `, ${data.destino.ciudad}` : ""}
              </h2>
              {data.destino.meses && data.destino.meses.length > 0 && data.destino.año && (
                <p style={{ margin: "4px 0 0 0", fontSize: "16px", color: template.secondaryColor }}>
                  {getMonthsDisplay(data.destino.meses)} {data.destino.año}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Requisitos Migratorios */}
        {data.requisitosMigratorios && data.requisitosMigratorios.length > 0 && (
          <div
            style={{
              background: "white",
              border: "1px solid #666",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ color: "#333", marginBottom: "8px", fontSize: "16px", fontWeight: "bold" }}>
              REQUISITOS MIGRATORIOS IMPORTANTES
            </h3>
            <ul style={{ listStyle: "disc", marginLeft: "20px", marginBottom: "0" }}>
              {data.requisitosMigratorios.map((req: string, index: number) => (
                <li key={index} style={{ marginBottom: "4px", fontSize: "14px" }}>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Datos del Cliente */}
        {Object.keys(data.cliente || {}).length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                color: template.primaryColor,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
                paddingBottom: "4px",
                borderBottom: `2px solid ${template.primaryColor}`,
              }}
            >
              DATOS DEL CLIENTE
            </h2>
            <div
              style={{
                background: "#f8f9fa",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {data.cliente.cantidad_pasajeros > 0 && (
                <div style={{ marginBottom: "6px" }}>
                  <strong style={{ color: template.primaryColor, display: "inline-block", width: "140px" }}>
                    TOTAL PASAJEROS:
                  </strong>{" "}
                  {data.cliente.cantidad_pasajeros}
                </div>
              )}
              {data.cliente.cantidad_adultos > 0 && (
                <div style={{ marginBottom: "6px" }}>
                  <strong style={{ color: template.primaryColor, display: "inline-block", width: "140px" }}>
                    ADULTOS:
                  </strong>{" "}
                  {data.cliente.cantidad_adultos}
                </div>
              )}
              {data.cliente.cantidad_menores > 0 && (
                <div style={{ marginBottom: "6px" }}>
                  <strong style={{ color: template.primaryColor, display: "inline-block", width: "140px" }}>
                    MENORES:
                  </strong>{" "}
                  {data.cliente.cantidad_menores}
                </div>
              )}
              {data.cliente.cantidad_infantes > 0 && (
                <div style={{ marginBottom: "6px" }}>
                  <strong style={{ color: template.primaryColor, display: "inline-block", width: "140px" }}>
                    INFANTES:
                  </strong>{" "}
                  {data.cliente.cantidad_infantes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vuelos */}
        {data.vuelos && data.vuelos.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                color: template.primaryColor,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "12px",
                paddingBottom: "4px",
                borderBottom: `2px solid ${template.primaryColor}`,
              }}
            >
              VUELOS
            </h2>
            {data.vuelos.map((vuelo: any, index: number) => (
              <div
                key={index}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: "white",
                  pageBreakInside: "auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "12px",
                    color: template.primaryColor,
                    fontWeight: "bold",
                  }}
                >
                  {vuelo.nombre || `Compañía Aérea ${index + 1}`}
                </h3>

                {(vuelo.fechaSalida || vuelo.fechaRetorno) && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>Fechas del vuelo:</div>
                    {vuelo.fechaSalida && (
                      <div style={{ marginBottom: "4px", fontSize: "13px" }}>
                        <strong style={{ color: template.primaryColor }}>Salida:</strong>{" "}
                        {formatDate(vuelo.fechaSalida)}
                      </div>
                    )}
                    {vuelo.fechaRetorno && (
                      <div style={{ marginBottom: "4px", fontSize: "13px" }}>
                        <strong style={{ color: template.primaryColor }}>Retorno:</strong>{" "}
                        {formatDate(vuelo.fechaRetorno)}
                      </div>
                    )}
                  </div>
                )}

                {vuelo.tipoTarifa && (
                  <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                    <strong style={{ color: template.primaryColor }}>Tipo de tarifa:</strong>{" "}
                    {getTipoTarifaLabel(vuelo.tipoTarifa)}
                  </div>
                )}

                {/* Imágenes con dimensiones naturales */}
                {vuelo.imagenes && vuelo.imagenes.length > 0 && (
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    {vuelo.imagenes.slice(0, 2).map((imagen: string, imgIndex: number) => (
                      <img
                        key={imgIndex}
                        src={imagen || "/placeholder.svg"}
                        alt={`Vuelo ${index + 1} - ${imgIndex + 1}`}
                        crossOrigin="anonymous"
                        style={{
                          maxWidth: "400px", // Aumentado de 300px a 400px
                          maxHeight: "160px", // Aumentado de 120px a 160px
                          objectFit: "contain", // Mantener proporciones
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                          marginBottom: "8px",
                          display: "block",
                          margin: "0 auto 8px auto", // Centrar la imagen
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Opciones de equipaje */}
                {vuelo.opciones && vuelo.opciones.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <h4
                      style={{
                        color: template.primaryColor,
                        marginBottom: "8px",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                    >
                      Opciones de equipaje:
                    </h4>

                    {(() => {
                      const opcionesPorPasajero = vuelo.opciones.reduce((acc: any, opcion: any) => {
                        if (!acc[opcion.pasajero]) acc[opcion.pasajero] = []
                        acc[opcion.pasajero].push(opcion)
                        return acc
                      }, {})

                      return (
                        <div>
                          {opcionesPorPasajero.adulto && opcionesPorPasajero.adulto.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <h5
                                style={{
                                  color: template.primaryColor,
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  margin: "8px 0 6px 0",
                                  borderBottom: `1px solid ${template.primaryColor}`,
                                  paddingBottom: "2px",
                                }}
                              >
                                ADULTOS
                              </h5>
                              {opcionesPorPasajero.adulto.map((opcion: any, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "4px 0",
                                    borderBottom: "1px solid #eee",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span>
                                    {opcion.tipo === "mochila"
                                      ? "Solo mochila"
                                      : opcion.tipo === "mochilaCarryOn"
                                        ? "Mochila y equipaje de mano"
                                        : opcion.tipo === "mochilaCarryOnValija"
                                          ? "Mochila, equipaje de mano y maleta de 23kg"
                                          : "Tarifa única"}
                                  </span>
                                  <strong style={{ color: template.primaryColor }}>
                                    {formatCurrency(opcion.precio, data.totales?.currency || "USD")}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          )}

                          {opcionesPorPasajero.menor && opcionesPorPasajero.menor.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <h5
                                style={{
                                  color: template.primaryColor,
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  margin: "8px 0 6px 0",
                                  borderBottom: `1px solid ${template.primaryColor}`,
                                  paddingBottom: "2px",
                                }}
                              >
                                MENORES
                              </h5>
                              {opcionesPorPasajero.menor.map((opcion: any, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "4px 0",
                                    borderBottom: "1px solid #eee",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span>
                                    {opcion.tipo === "mochila"
                                      ? "Solo mochila"
                                      : opcion.tipo === "mochilaCarryOn"
                                        ? "Mochila y equipaje de mano"
                                        : opcion.tipo === "mochilaCarryOnValija"
                                          ? "Mochila, equipaje de mano y maleta de 23kg"
                                          : "Tarifa única"}
                                  </span>
                                  <strong style={{ color: template.primaryColor }}>
                                    {formatCurrency(opcion.precio, data.totales?.currency || "USD")}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          )}

                          {opcionesPorPasajero.infante && opcionesPorPasajero.infante.length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <h5
                                style={{
                                  color: template.primaryColor,
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  margin: "8px 0 6px 0",
                                  borderBottom: `1px solid ${template.primaryColor}`,
                                  paddingBottom: "2px",
                                }}
                              >
                                INFANTES
                              </h5>
                              {opcionesPorPasajero.infante.map((opcion: any, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "4px 0",
                                    borderBottom: "1px solid #eee",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span>Tarifa única</span>
                                  <strong style={{ color: template.primaryColor }}>
                                    {formatCurrency(opcion.precio, data.totales?.currency || "USD")}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Condiciones de tarifa */}
                {vuelo.condicionesTarifa && vuelo.condicionesTarifa.length > 0 && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "10px",
                      borderRadius: "4px",
                      marginBottom: "10px",
                    }}
                  >
                    <h4
                      style={{
                        color: template.primaryColor,
                        marginBottom: "6px",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      Condiciones de tarifa:
                    </h4>
                    <ul style={{ marginLeft: "15px", fontSize: "12px" }}>
                      {vuelo.condicionesTarifa.map((condicion: string, condIndex: number) => (
                        <li key={condIndex} style={{ marginBottom: "3px" }}>
                          {condicion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Texto libre */}
                {vuelo.textoLibre && (
                  <div
                    style={{
                      background: "#fff",
                      borderLeft: `3px solid ${template.primaryColor}`,
                      padding: "10px",
                      marginTop: "10px",
                      fontStyle: "italic",
                      fontSize: "12px",
                    }}
                  >
                    <p style={{ margin: "0" }}>{vuelo.textoLibre}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Alojamiento */}
        {data.hoteles && data.hoteles.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                color: template.primaryColor,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "12px",
                paddingBottom: "4px",
                borderBottom: `2px solid ${template.primaryColor}`,
              }}
            >
              ALOJAMIENTO
            </h2>
            {data.hoteles.map((hotel: any, index: number) => (
              <div
                key={index}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: "white",
                  pageBreakInside: "auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "8px",
                    color: template.primaryColor,
                    fontWeight: "bold",
                  }}
                >
                  {hotel.nombre || `Alojamiento ${index + 1}`}
                </h3>

                {hotel.ciudad && (
                  <div
                    style={{
                      marginBottom: "10px",
                      fontSize: "13px",
                      fontStyle: "italic",
                      color: template.secondaryColor,
                    }}
                  >
                    <strong style={{ color: template.primaryColor }}>Ciudad:</strong> {hotel.ciudad}
                  </div>
                )}

                {/* Imágenes del hotel con dimensiones naturales */}
                {hotel.imagenes && hotel.imagenes.length > 0 && (
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    {hotel.imagenes.slice(0, 2).map((imagen: string, imgIndex: number) => (
                      <img
                        key={imgIndex}
                        src={imagen || "/placeholder.svg"}
                        alt={`Hotel ${index + 1} - ${imgIndex + 1}`}
                        crossOrigin="anonymous"
                        style={{
                          maxWidth: "400px", // Aumentado de 300px a 400px
                          maxHeight: "160px", // Aumentado de 120px a 160px
                          objectFit: "contain",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                          marginBottom: "8px",
                          display: "block",
                          margin: "0 auto 8px auto", // Centrar
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong style={{ color: template.primaryColor }}>Check-in:</strong> {formatDate(hotel.checkin)}
                  </div>
                  <div>
                    <strong style={{ color: template.primaryColor }}>Check-out:</strong> {formatDate(hotel.checkout)}
                  </div>
                  {hotel.cantidadHabitaciones && (
                    <div>
                      <strong style={{ color: template.primaryColor }}>Habitaciones:</strong>{" "}
                      {hotel.cantidadHabitaciones}
                    </div>
                  )}
                </div>

                {hotel.mostrarPrecio && hotel.precioTotal && (
                  <div
                    style={{ textAlign: "right", fontWeight: "bold", color: template.primaryColor, fontSize: "16px" }}
                  >
                    Precio total: {formatCurrency(hotel.precioTotal, data.totales?.currency || "USD")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Traslados */}
        {data.traslados && data.traslados.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                color: template.primaryColor,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "12px",
                paddingBottom: "4px",
                borderBottom: `2px solid ${template.primaryColor}`,
              }}
            >
              TRASLADOS
            </h2>
            {data.traslados.map((traslado: any, index: number) => (
              <div
                key={index}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: "white",
                  pageBreakInside: "auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "12px",
                    color: template.primaryColor,
                    fontWeight: "bold",
                  }}
                >
                  {traslado.nombre || `Empresa de Traslado ${index + 1}`}
                </h3>

                {/* Imágenes del traslado */}
                {traslado.imagenes && traslado.imagenes.length > 0 && (
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    {traslado.imagenes.slice(0, 1).map((imagen: string, imgIndex: number) => (
                      <img
                        key={imgIndex}
                        src={imagen || "/placeholder.svg"}
                        alt={`Traslado ${index + 1} - ${imgIndex + 1}`}
                        crossOrigin="anonymous"
                        style={{
                          maxWidth: "350px", // Aumentado de 250px a 350px
                          maxHeight: "140px", // Aumentado de 100px a 140px
                          objectFit: "contain",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                          marginBottom: "8px",
                          display: "block",
                          margin: "0 auto 8px auto", // Centrar
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                    fontSize: "13px",
                  }}
                >
                  {traslado.origen && (
                    <div>
                      <strong style={{ color: template.primaryColor }}>Origen:</strong> {traslado.origen}
                    </div>
                  )}
                  {traslado.destino && (
                    <div>
                      <strong style={{ color: template.primaryColor }}>Destino:</strong> {traslado.destino}
                    </div>
                  )}
                  {traslado.tipoTraslado && (
                    <div>
                      <strong style={{ color: template.primaryColor }}>Tipo:</strong>{" "}
                      {traslado.tipoTraslado === "privado" ? "Privado" : "Regular"}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: template.primaryColor }}>Fecha:</strong> {formatDate(traslado.fecha)}
                  </div>
                  {traslado.hora && (
                    <div>
                      <strong style={{ color: template.primaryColor }}>Hora:</strong> {traslado.hora}
                    </div>
                  )}
                </div>

                {traslado.mostrarPrecio && traslado.precio && (
                  <div
                    style={{ textAlign: "right", fontWeight: "bold", color: template.primaryColor, fontSize: "16px" }}
                  >
                    Precio: {formatCurrency(traslado.precio, data.totales?.currency || "USD")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Servicios Adicionales */}
        {data.actividades && data.actividades.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                color: template.primaryColor,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "12px",
                paddingBottom: "4px",
                borderBottom: `2px solid ${template.primaryColor}`,
              }}
            >
              SERVICIOS ADICIONALES
            </h2>
            {data.actividades.map((servicio: any, index: number) => (
              <div
                key={index}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: "white",
                  pageBreakInside: "auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "12px",
                    color: template.primaryColor,
                    fontWeight: "bold",
                  }}
                >
                  {servicio.nombre}
                </h3>

                {/* Imágenes del servicio */}
                {servicio.imagenes && servicio.imagenes.length > 0 && (
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    {servicio.imagenes.slice(0, 1).map((imagen: string, imgIndex: number) => (
                      <img
                        key={imgIndex}
                        src={imagen || "/placeholder.svg"}
                        alt={`${servicio.nombre} - ${imgIndex + 1}`}
                        crossOrigin="anonymous"
                        style={{
                          maxWidth: "350px", // Aumentado de 250px a 350px
                          maxHeight: "140px", // Aumentado de 100px a 140px
                          objectFit: "contain",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                          marginBottom: "8px",
                          display: "block",
                          margin: "0 auto 8px auto", // Centrar
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    ))}
                  </div>
                )}

                <p style={{ marginBottom: "12px", fontSize: "14px" }}>{servicio.descripcion}</p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong style={{ color: template.primaryColor }}>Fecha:</strong> {formatDate(servicio.fecha)}
                  </div>
                  <div>
                    <strong style={{ color: template.primaryColor }}>Duración:</strong> {servicio.duracion}
                  </div>
                </div>

                {servicio.mostrarPrecio && (
                  <div
                    style={{ textAlign: "right", fontWeight: "bold", color: template.primaryColor, fontSize: "16px" }}
                  >
                    Precio: {formatCurrency(servicio.precio, data.totales?.currency || "USD")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Total - Solo mostrar si está habilitado */}
        {data.totales?.mostrar_total && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "20px",
              borderRadius: "6px",
              marginTop: "20px",
              border: `2px solid ${template.primaryColor}`,
              pageBreakInside: "avoid",
              breakInside: "avoid",
              pageBreakBefore: "auto",
              minHeight: "150px",
            }}
          >
            <h2
              style={{
                color: template.primaryColor,
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "15px",
                paddingBottom: "4px",
                borderBottom: `2px solid ${template.primaryColor}`,
              }}
            >
              TOTAL DE LA COTIZACIÓN
            </h2>
            <div style={{ textAlign: "center", padding: "15px" }}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: template.primaryColor,
                }}
              >
                {formatCurrency(data.totales?.total || 0, data.totales?.currency || "USD")}
              </div>
            </div>
          </div>
        )}

        {/* Observaciones */}
        {data.observaciones && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "15px",
              borderRadius: "6px",
              marginTop: "16px",
              pageBreakInside: "avoid",
              pageBreakBefore: "auto",
            }}
          >
            <h3 style={{ color: "#856404", marginBottom: "8px", fontSize: "16px", fontWeight: "bold" }}>
              OBSERVACIONES
            </h3>
            <p style={{ margin: "0", fontSize: "14px" }}>{data.observaciones}</p>
          </div>
        )}

        {/* Validez */}
        <div
          style={{
            border: "2px solid #000",
            padding: "15px",
            borderRadius: "6px",
            margin: "16px 0",
            textAlign: "center",
            background: "white",
            pageBreakInside: "avoid",
            pageBreakBefore: "auto",
          }}
        >
          <p
            style={{
              color: "#ff0000",
              fontSize: "16px",
              fontWeight: "bold",
              margin: "0",
            }}
          >
            {template.validityText || "Esta cotización es válida por 15 días desde la fecha de emisión."}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            color: template.secondaryColor,
            fontSize: "12px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
            pageBreakInside: "avoid",
            pageBreakBefore: "auto",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            {template.agencyAddress && (
              <div style={{ marginBottom: "5px" }}>
                <span style={{ color: template.primaryColor, fontWeight: "bold", marginRight: "5px" }}>Dirección:</span>
                <span>{template.agencyAddress}</span>
              </div>
            )}
            {template.agencyPhone && (
              <div style={{ marginBottom: "5px" }}>
                <span style={{ color: template.primaryColor, fontWeight: "bold", marginRight: "5px" }}>Teléfono:</span>
                <span>{template.agencyPhone}</span>
              </div>
            )}
            {template.agencyEmail && (
              <div style={{ marginBottom: "5px" }}>
                <span style={{ color: template.primaryColor, fontWeight: "bold", marginRight: "5px" }}>Email:</span>
                <span>{template.agencyEmail}</span>
              </div>
            )}
          </div>
          <p style={{ margin: "0" }}>Generado automáticamente el {new Date().toLocaleDateString("es-ES")}</p>
        </div>
      </div>
    </div>
  )
}
