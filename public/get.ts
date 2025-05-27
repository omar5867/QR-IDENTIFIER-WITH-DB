import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // URL del endpoint de Strapi
    const baseUrl = process.env.STRAPI_API_URL;
    if (!baseUrl) throw new Error("STRAPI_API_URL no está definido");
    
    const strapiRes = await fetch(${baseUrl}/registrar-entradas, {
      headers: {
            "Content-Type": "application/json",
        // Authorization: Bearer ${process.env.STRAPI_TOKEN},
      },
      cache: 'no-store', // Opcional: para evitar cacheo si necesitas datos en tiempo real
    });

    if (!strapiRes.ok) {
      throw new Error(Error al hacer fetch: ${strapiRes.statusText});
    }

    const data = await strapiRes.json();
    const clientList = data.data; // Strapi devuelve la lista dentro de "data"

    return NextResponse.json({ success: true, clientList });
  } catch (error) {
    console.error('Error al obtener los clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos' },
      { status: 500 }
    );
  }
}