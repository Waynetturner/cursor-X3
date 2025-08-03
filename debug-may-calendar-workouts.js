console.log('=== DEBUGGING MAY CALENDAR FIRST WORKOUT ===')

function findFirstWorkoutInMay(startDate) {
  console.log(`\n=== TESTING START DATE: ${startDate} ===`)
  
  const mayYear = 2025
  const mayMonth = 4 // May (0-indexed)
  const firstDayOfMay = new Date(mayYear, mayMonth, 1)
  const startDayOfWeek = firstDayOfMay.getDay()
  const calendarStart = new Date(firstDayOfMay)
  calendarStart.setDate(calendarStart.getDate() - startDayOfWeek)
  
  console.log(`Calendar starts from: ${calendarStart.toISOString().split('T')[0]}`)
  
  let firstWorkoutFound = false
  for (let i = 0; i < 35; i++) {
    const currentDate = new Date(calendarStart)
    currentDate.setDate(calendarStart.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    const isThisMonth = currentDate.getMonth() === mayMonth
    
    const start = new Date(startDate)
    const target = new Date(dateStr)
    start.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    let workoutType = 'Rest'
    if (daysSinceStart >= 0) {
      const week = Math.floor(daysSinceStart / 7) + 1
      const dayInWeek = daysSinceStart % 7
      const schedule = week <= 4 
        ? ['Push', 'Pull', 'Rest', 'Push', 'Pull', 'Rest', 'Rest']
        : ['Push', 'Pull', 'Push', 'Pull', 'Push', 'Pull', 'Rest']
      workoutType = schedule[dayInWeek]
    }
    
    if (isThisMonth) {
      console.log(`  ${dateStr}: ${workoutType} (daysSinceStart: ${daysSinceStart})`)
      
      if (!firstWorkoutFound && workoutType !== 'Rest') {
        console.log(`    *** FIRST WORKOUT IN MAY: ${dateStr} shows ${workoutType} ***`)
        firstWorkoutFound = true
      }
    }
  }
  
  if (!firstWorkoutFound) {
    console.log('    *** NO WORKOUTS FOUND IN MAY CALENDAR ***')
  }
}

const testDates = [
  '2025-05-26', // 2 days before 5/28
  '2025-05-27', // 1 day before 5/28  
  '2025-05-28', // Expected start date
  '2025-05-29', // Current incorrect start date
  '2025-05-30'  // 1 day after 5/29
]

testDates.forEach(findFirstWorkoutInMay)

console.log('\n=== ANALYSIS ===')
console.log('To have first workout appear on 5/28 in May calendar:')
console.log('  - Start date should be 2025-05-28')
console.log('  - This would make 5/28 show as Push (first workout)')
console.log('')
console.log('If user sees first workout on 5/29:')
console.log('  - Database likely has x3_start_date = "2025-05-29"')
console.log('  - Need to update to "2025-05-28" to shift back one day')
