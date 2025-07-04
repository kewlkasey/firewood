
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStateCounts() {
  console.log('Testing state counting logic...')
  
  // First, get all stands to see the data
  const { data: allStands, error } = await supabase
    .from('firewood_stands')
    .select('id, stand_name, address, is_approved')
    .order('address')
  
  if (error) {
    console.error('Error fetching stands:', error)
    return
  }
  
  console.log(`Found ${allStands.length} total stands`)
  console.log('\nSample addresses:')
  allStands.slice(0, 10).forEach(stand => {
    console.log(`- ${stand.stand_name}: ${stand.address} (${stand.is_approved ? 'approved' : 'pending'})`)
  })
  
  // Test state counting logic similar to frontend
  const STATE_ABBREVIATIONS = {
    'Connecticut': 'CT',
    'Michigan': 'MI',
    'Iowa': 'IA',
    'Pennsylvania': 'PA'
  }
  
  console.log('\n=== State Count Analysis ===')
  
  Object.entries(STATE_ABBREVIATIONS).forEach(([stateName, stateAbbr]) => {
    const count = allStands.filter((stand) => {
      const address = stand.address
      
      return address.includes(`, ${stateAbbr} `) || 
             address.includes(`, ${stateAbbr},`) ||
             address.includes(` ${stateAbbr} `) ||
             address.endsWith(`, ${stateAbbr}`) ||
             address.includes(stateName)
    }).length
    
    console.log(`${stateName} (${stateAbbr}): ${count} stands`)
    
    // Show examples for states with data
    if (count > 0) {
      console.log('  Examples:')
      allStands.filter((stand) => {
        const address = stand.address
        
        return address.includes(`, ${stateAbbr} `) || 
               address.includes(`, ${stateAbbr},`) ||
               address.includes(` ${stateAbbr} `) ||
               address.endsWith(`, ${stateAbbr}`) ||
               address.includes(stateName)
      }).slice(0, 3).forEach(stand => {
        console.log(`    - ${stand.stand_name}: ${stand.address}`)
      })
    }
  })
}

testStateCounts().catch(console.error)
