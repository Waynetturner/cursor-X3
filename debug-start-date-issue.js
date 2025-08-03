console.log('=== DEBUGGING START DATE DISPLAY ISSUE ===')

const testStartDates = ['2025-05-28', '2025-05-29']

function testCalendarGeneration(startDate) {
  console.log(`\n=== TESTING START DATE: ${startDate} ===`)
  
  const mayYear = 2025
  const mayMonth = 4 // May (0-indexed)
  const firstDayOfMay = new Date(mayYear, mayMonth, 1)
  const startDayOfWeek = firstDayOfMay.getDay() // 0 = Sunday
  
  console.log(`First day of May 2025: ${firstDayOfMay.toDateString()} (day ${startDayOfWeek})`)
  
  const calendarStart = new Date(firstDayOfMay)
  calendarStart.setDate(calendarStart.getDate() - startDayOfWeek)
  
  console.log(`Calendar starts from: ${calendarStart.toISOString().split('T')[0]}`)
  
  console.log('\nFirst week of May calendar:')
  for (let i = 0; i < 7; i++) {
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
    
    console.log(`  ${dateStr}: ${workoutType} (daysSinceStart: ${daysSinceStart}, thisMonth: ${isThisMonth})`)
    
    if (dateStr === '2025-05-28' || dateStr === '2025-05-29') {
      if (daysSinceStart === 0) {
        console.log(`    *** START DATE: ${dateStr} shows first workout (${workoutType}) ***`)
      }
      if (isThisMonth && workoutType !== 'Rest') {
        console.log(`    *** VISIBLE WORKOUT: ${dateStr} shows ${workoutType} in May calendar ***`)
      }
    }
  }
}

testStartDates.forEach(testCalendarGeneration)

console.log('\n=== ANALYSIS ===')
console.log('If user sees 5/29 as start date in calendar:')
console.log('  - Database likely has x3_start_date = "2025-05-29"')
console.log('  - Need to update database to "2025-05-28"')
console.log('')
console.log('If user sees 5/28 as start date but calendar shows wrong first workout:')
console.log('  - Database has correct date but calendar logic has issue')
console.log('  - Need to investigate date calculation in calendar generation')
