
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// State abbreviations mapping
const STATE_ABBREVIATIONS = {
  'Connecticut': 'CT',
  'Michigan': 'MI', 
  'Iowa': 'IA',
  'Pennsylvania': 'PA'
}

async function cleanseAddressData() {
  console.log('Starting address data cleansing...')
  
  // Get all stands
  const { data: stands, error } = await supabase
    .from('firewood_stands')
    .select('id, address')
  
  if (error) {
    console.error('Error fetching stands:', error)
    return
  }
  
  console.log(`Found ${stands.length} stands to process`)
  
  let updatedCount = 0
  
  for (const stand of stands) {
    const originalAddress = stand.address
    let cleanedAddress = originalAddress
    
    // Clean and standardize the address format
    // Remove extra spaces and normalize commas
    cleanedAddress = cleanedAddress.replace(/\s+/g, ' ').trim()
    cleanedAddress = cleanedAddress.replace(/,\s*,/g, ',') // Remove double commas
    cleanedAddress = cleanedAddress.replace(/,\s+/g, ', ') // Standardize comma spacing
    
    // Ensure state abbreviations are used consistently
    Object.entries(STATE_ABBREVIATIONS).forEach(([fullName, abbr]) => {
      // Replace full state names with abbreviations
      const regex = new RegExp(`\\b${fullName}\\b`, 'gi')
      cleanedAddress = cleanedAddress.replace(regex, abbr)
    })
    
    // Ensure proper formatting: "Street, City, STATE ZIP"
    // This regex looks for patterns like "City STATE ZIP" and ensures comma before state
    cleanedAddress = cleanedAddress.replace(/([^,])\s+(CT|MI|IA|PA)\s+(\d{5})/g, '$1, $2 $3')
    
    // If address was modified, update it
    if (cleanedAddress !== originalAddress) {
      console.log(`Updating: "${originalAddress}" → "${cleanedAddress}"`)
      
      const { error: updateError } = await supabase
        .from('firewood_stands')
        .update({ address: cleanedAddress })
        .eq('id', stand.id)
      
      if (updateError) {
        console.error(`Error updating stand ${stand.id}:`, updateError)
      } else {
        updatedCount++
      }
    }
  }
  
  console.log(`\nCleansing complete! Updated ${updatedCount} out of ${stands.length} addresses.`)
  
  // Test the results
  console.log('\nTesting state counting after cleansing...')
  
  const { data: cleanedStands, error: testError } = await supabase
    .from('firewood_stands')
    .select('address')
  
  if (testError) {
    console.error('Error fetching cleaned data:', testError)
    return
  }
  
  Object.entries(STATE_ABBREVIATIONS).forEach(([stateName, stateAbbr]) => {
    const count = cleanedStands.filter((stand) => {
      const address = stand.address
      return address.includes(`, ${stateAbbr} `) || 
             address.includes(`, ${stateAbbr},`) ||
             address.endsWith(`, ${stateAbbr}`)
    }).length
    
    console.log(`${stateName} (${stateAbbr}): ${count} stands`)
  })
}

cleanseAddressData().catch(console.error)
