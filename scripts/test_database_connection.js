import { supabase } from "../lib/supabase.js"

async function testDatabaseConnection() {
  console.log("🔍 Testing Supabase database connection...")

  try {
    // Test 1: Check if we can connect to Supabase
    console.log("\n1. Testing basic connection...")
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("✅ Supabase connection successful")
    console.log("Current user:", user ? user.email : "No user logged in")

    // Test 2: Test profiles table
    console.log("\n2. Testing profiles table...")

    // First, let's see if we can read from the table
    const { data: existingProfiles, error: readError } = await supabase.from("profiles").select("*").limit(5)

    if (readError) {
      console.error("❌ Error reading profiles:", readError)
    } else {
      console.log("✅ Can read profiles table")
      console.log("Existing profiles count:", existingProfiles.length)
    }

    // Test 3: Test firewood_stands table
    console.log("\n3. Testing firewood_stands table...")

    const { data: existingStands, error: standsReadError } = await supabase.from("firewood_stands").select("*").limit(5)

    if (standsReadError) {
      console.error("❌ Error reading firewood_stands:", standsReadError)
    } else {
      console.log("✅ Can read firewood_stands table")
      console.log("Existing stands count:", existingStands.length)
    }

    // Test 4: Test reviews table
    console.log("\n4. Testing reviews table...")

    const { data: existingReviews, error: reviewsReadError } = await supabase.from("reviews").select("*").limit(5)

    if (reviewsReadError) {
      console.error("❌ Error reading reviews:", reviewsReadError)
    } else {
      console.log("✅ Can read reviews table")
      console.log("Existing reviews count:", existingReviews.length)
    }

    // Test 5: Test table structure
    console.log("\n5. Testing table structures...")

    // Get table info by trying to insert with invalid data to see the schema
    const { error: profileSchemaError } = await supabase.from("profiles").insert({ test: "schema_check" })

    if (profileSchemaError) {
      console.log("📋 Profiles table schema info:", profileSchemaError.message)
    }

    const { error: standsSchemaError } = await supabase.from("firewood_stands").insert({ test: "schema_check" })

    if (standsSchemaError) {
      console.log("📋 Firewood stands table schema info:", standsSchemaError.message)
    }

    // Test 6: Test authentication signup (if no user is logged in)
    if (!user) {
      console.log("\n6. Testing user registration...")

      const testEmail = `test-${Date.now()}@example.com`
      const testPassword = "TestPassword123!"

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            first_name: "Test",
            last_name: "User",
          },
        },
      })

      if (signUpError) {
        console.error("❌ Registration test failed:", signUpError)
      } else {
        console.log("✅ Registration test successful")
        console.log("Test user created:", signUpData.user?.id)

        // Try to manually insert profile
        if (signUpData.user) {
          console.log("\n7. Testing manual profile creation...")

          const { data: profileData, error: profileInsertError } = await supabase
            .from("profiles")
            .insert({
              id: signUpData.user.id,
              email: testEmail,
              first_name: "Test",
              last_name: "User",
            })
            .select()

          if (profileInsertError) {
            console.error("❌ Manual profile creation failed:", profileInsertError)
          } else {
            console.log("✅ Manual profile creation successful:", profileData)
          }
        }
      }
    }

    console.log("\n🎉 Database connection test completed!")
  } catch (error) {
    console.error("💥 Unexpected error during testing:", error)
  }
}

// Run the test
testDatabaseConnection()
