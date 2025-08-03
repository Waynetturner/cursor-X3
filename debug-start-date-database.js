const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStartDate() {
  console.log('=== DEBUGGING START DATE IN DATABASE ===')
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, x3_start_date, created_at')
      .limit(5)
    
    if (error) {
      console.error('Error querying profiles:', error)
      return
    }
    
    console.log('User profiles with start dates:')
    profiles?.forEach(profile => {
      console.log(`  ID: ${profile.id}`)
      console.log(`  Start Date: ${profile.x3_start_date}`)
      console.log(`  Created: ${profile.created_at}`)
      console.log('')
    })
    
    console.log('=== TESTING MAY CALENDAR GENERATION ===')
    const mayYear = 2025
    const mayMonth = 4 // May (0-indexed)
    const firstDayOfMay = new Date(mayYear, mayMonth, 1)
    const startDayOfWeek = firstDayOfMay.getDay()
    const calendarStart = new Date(firstDayOfMay)
    calendarStart.setDate(calendarStart.getDate() - startDayOfWeek)
    
    console.log(`May calendar starts from: ${calendarStart.toISOString().split('T')[0]}`)
    console.log(`First day of May: ${firstDayOfMay.toISOString().split('T')[0]}`)
    console.log(`Start day of week: ${startDayOfWeek} (0=Sunday)`)
    
    console.log('\nFirst week of May calendar:')
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(calendarStart)
      currentDate.setDate(calendarStart.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      const isThisMonth = currentDate.getMonth() === mayMonth
      
      console.log(`  ${dateStr}: dayOfMonth=${currentDate.getDate()}, thisMonth=${isThisMonth}`)
      
      if (dateStr === '2025-05-28' || dateStr === '2025-05-29') {
        console.log(`    *** ${dateStr} - This could be the start date ***`)
      }
    }
    
  } catch (error) {
    console.error('Error in debug script:', error)
  }
}

debugStartDate()
