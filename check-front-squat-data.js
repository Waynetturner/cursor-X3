import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
let supabaseUrl, supabaseKey
try {
  const envFile = readFileSync('.env.local', 'utf8')
  const envLines = envFile.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  
  for (const line of envLines) {
    const [key, value] = line.split('=').map(s => s.trim())
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value.replace(/"/g, '')
    }
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      supabaseKey = value.replace(/"/g, '')
    }
  }
} catch (error) {
  console.error('Could not read .env.local file:', error.message)
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Band hierarchy from X3 documentation: Ultra Light < White < Light Gray < Dark Gray < Black < Elite
const BAND_HIERARCHY = {
  'Ultra Light': 1,
  'White': 2,
  'Light Gray': 3,
  'Dark Gray': 4,
  'Black': 5,
  'Elite': 6
}

function getBandRank(bandColor) {
  return BAND_HIERARCHY[bandColor] || 0
}

function getHighestBand(bandColors) {
  if (bandColors.length === 0) return null
  return bandColors.reduce((highest, current) => {
    return getBandRank(current) > getBandRank(highest) ? current : highest
  })
}

async function analyzeFrontSquat() {
  try {
    console.log('🔍 Getting authenticated user...')
    
    // First, get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Authentication error:', authError)
      return
    }
    
    if (!user) {
      console.error('❌ No authenticated user found')
      return
    }
    
    console.log(`👤 User authenticated: ${user.email} (ID: ${user.id})`)
    
    console.log('🔍 Querying Front Squat workout history...')
    
    // Query all Front Squat records for this specific user
    const { data: frontSquatData, error } = await supabase
      .from('workout_exercises')
      .select('band_color, full_reps, partial_reps, workout_local_date_time, created_at_utc')
      .eq('user_id', user.id)
      .eq('exercise_name', 'Front Squat')
      .order('created_at_utc', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    if (!frontSquatData || frontSquatData.length === 0) {
      console.log('📭 No Front Squat workout data found in database')
      return
    }

    console.log(`📊 Found ${frontSquatData.length} Front Squat workout records`)
    
    // Extract all unique bands used
    const bandsUsed = [...new Set(frontSquatData.map(record => record.band_color).filter(Boolean))]
    
    if (bandsUsed.length === 0) {
      console.log('❌ No valid band colors found in Front Squat data')
      return
    }
    
    // Find the highest band used
    const highestBand = getHighestBand(bandsUsed)
    
    // Find the best rep count for that highest band
    const highestBandRecords = frontSquatData.filter(record => record.band_color === highestBand)
    const bestRepCount = Math.max(...highestBandRecords.map(record => record.full_reps || 0))
    
    console.log('\n🎯 ANALYSIS RESULTS:')
    console.log(`Exercise: Front Squat`)
    console.log(`Highest Band Used: ${highestBand}`)
    console.log(`Best Full Rep Count (${highestBand}): ${bestRepCount}`)
    console.log(`Card Display Format: FRONT SQUAT (${bestRepCount})`)
    
    console.log('\n📋 Band Usage Summary:')
    bandsUsed.sort((a, b) => getBandRank(b) - getBandRank(a)).forEach(band => {
      const bandRecords = frontSquatData.filter(record => record.band_color === band)
      const maxReps = Math.max(...bandRecords.map(record => record.full_reps || 0))
      const workouts = bandRecords.length
      console.log(`  ${band}: ${maxReps} max reps (${workouts} workouts)`)
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

analyzeFrontSquat()
