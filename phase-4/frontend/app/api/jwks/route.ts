/**
 * JWKS Endpoint for Better Auth
 * 
 * This route serves the JSON Web Key Set (JWKS) for JWT verification.
 * Backend uses this endpoint to verify JWT tokens issued by Better Auth.
 * 
 * Path: /api/jwks (mapped from /.well-known/jwks.json via rewrite)
 * 
 * Better Auth's JWT plugin stores keys in the database (jwks table).
 * This route queries the database and formats the response as JWKS.
 */

/**
 * Get JWKS from database
 * Better Auth's JWT plugin stores public keys in the jwks table
 */
export async function GET() {
  try {
    // Import database and schema
    const { db } = await import("@/lib/db-drizzle");
    const { jwks } = await import("@/drizzle/schema");
    
    // Fetch all JWKS keys from database
    const keys = await db.select().from(jwks);
    
    if (keys.length === 0) {
      // No keys found - Better Auth hasn't generated keys yet
      // Return empty JWKS (keys will be generated on first token creation)
      return new Response(
        JSON.stringify({ keys: [] }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        }
      );
    }
    
    // Format as JWKS (JSON Web Key Set)
    const jwksResponse = {
      keys: keys.map((key: { id: string; publicKey: string }) => {
        try {
          // Parse the public key (stored as JSON string in database)
          const publicKey = JSON.parse(key.publicKey) as Record<string, unknown>;
          return {
            ...publicKey,
            kid: key.id, // Key ID
          };
        } catch (parseError) {
          console.error(`Failed to parse public key ${key.id}:`, parseError);
          return null;
        }
      }).filter((key: Record<string, unknown> | null): key is Record<string, unknown> => key !== null), // Remove any null entries
    };
    
    return new Response(JSON.stringify(jwksResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("JWKS endpoint error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch JWKS",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const runtime = "nodejs";

