import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function POST() {
  let pool: Pool | null = null

  try {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    })

    // Create locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        location_type TEXT NOT NULL CHECK (location_type IN ('ghat', 'temple', 'parking', 'medical', 'security', 'food_court', 'accommodation')),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        capacity INTEGER,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "locations_select_all" ON public.locations;
      CREATE POLICY "locations_select_all" ON public.locations FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "locations_insert_admin" ON public.locations;
      CREATE POLICY "locations_insert_admin" ON public.locations FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "locations_update_admin" ON public.locations;
      CREATE POLICY "locations_update_admin" ON public.locations FOR UPDATE USING (true);
    `)

    // Create cameras table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.cameras (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        camera_type TEXT NOT NULL CHECK (camera_type IN ('droidcam', 'frontend', 'fixed')),
        status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
        stream_url TEXT,
        location_id UUID REFERENCES public.locations(id),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "cameras_select_all" ON public.cameras;
      CREATE POLICY "cameras_select_all" ON public.cameras FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "cameras_insert_admin" ON public.cameras;
      CREATE POLICY "cameras_insert_admin" ON public.cameras FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "cameras_update_admin" ON public.cameras;
      CREATE POLICY "cameras_update_admin" ON public.cameras FOR UPDATE USING (true);
      
      DROP POLICY IF EXISTS "cameras_delete_admin" ON public.cameras;
      CREATE POLICY "cameras_delete_admin" ON public.cameras FOR DELETE USING (true);
    `)

    // Create other necessary tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.crowd_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        camera_id UUID REFERENCES public.cameras(id),
        location_id UUID REFERENCES public.locations(id),
        person_count INTEGER NOT NULL DEFAULT 0,
        confidence_score DECIMAL(3, 2),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_type TEXT NOT NULL CHECK (alert_type IN ('overcrowding', 'emergency', 'maintenance', 'security')),
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        location_id UUID REFERENCES public.locations(id),
        camera_id UUID REFERENCES public.cameras(id),
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS public.heat_map_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_id UUID REFERENCES public.locations(id),
        density_level INTEGER NOT NULL CHECK (density_level BETWEEN 0 AND 100),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS on all tables
      ALTER TABLE public.crowd_data ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.heat_map_data ENABLE ROW LEVEL SECURITY;

      -- Create policies for all tables
      CREATE POLICY "crowd_data_select_all" ON public.crowd_data FOR SELECT USING (true);
      CREATE POLICY "crowd_data_insert_all" ON public.crowd_data FOR INSERT WITH CHECK (true);

      CREATE POLICY "alerts_select_all" ON public.alerts FOR SELECT USING (true);
      CREATE POLICY "alerts_insert_all" ON public.alerts FOR INSERT WITH CHECK (true);
      CREATE POLICY "alerts_update_all" ON public.alerts FOR UPDATE USING (true);

      CREATE POLICY "heat_map_data_select_all" ON public.heat_map_data FOR SELECT USING (true);
      CREATE POLICY "heat_map_data_insert_all" ON public.heat_map_data FOR INSERT WITH CHECK (true);
    `)

    // Insert seed data
    await pool.query(`
      INSERT INTO public.locations (name, location_type, latitude, longitude, capacity, description)
      VALUES 
        ('Ram Kund Main Ghat', 'ghat', 19.9975, 73.7873, 5000, 'Main bathing ghat at Ram Kund'),
        ('Sita Gumpha', 'temple', 19.998, 73.788, 1000, 'Sacred cave temple near Ram Kund'),
        ('Parking Area 1', 'parking', 19.996, 73.786, 500, 'Main parking area for pilgrims'),
        ('Medical Center 1', 'medical', 19.997, 73.787, 100, 'Primary medical facility'),
        ('Security Post 1', 'security', 19.9965, 73.7875, 50, 'Main security checkpoint'),
        ('Food Court 1', 'food_court', 19.9955, 73.7865, 300, 'Main food service area')
      ON CONFLICT (name) DO NOTHING;
    `)

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully with all tables and seed data",
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    if (pool) {
      await pool.end()
    }
  }
}
