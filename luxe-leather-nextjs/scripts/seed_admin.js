require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Take email and password from command line arguments, or use defaults
const TARGET_EMAIL = process.argv[2] || 'irtiza.s2918@gmail.com';
const NEW_PASSWORD = process.argv[3] || 'LuxeAdmin123!';

async function seedAdmin() {
  console.log(`Looking for user: ${TARGET_EMAIL}`);

  // 1. Find user by email (using listUsers and filtering)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  let user = users.find(u => u.email === TARGET_EMAIL);

  if (!user) {
    console.log(`User not found! Creating new user: ${TARGET_EMAIL}`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: NEW_PASSWORD,
      email_confirm: true
    });

    if (createError) {
      console.error("Error creating user:", createError.message);
      process.exit(1);
    }
    user = newUser.user;
    console.log("User created successfully.");
  } else {
    console.log(`User found (ID: ${user.id}). Updating password to ensure access...`);
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: NEW_PASSWORD, email_confirm: true }
    );

    if (updateError) {
      console.error("Error updating password:", updateError.message);
      process.exit(1);
    }
    console.log("Password updated successfully.");
  }

  // 2. Ensure user has 'admin' role in user_roles table
  console.log("Ensuring user has 'admin' role...");
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });

  if (roleError) {
    console.log("Note: Could not assign admin role (the table might not exist yet). Error:", roleError.message);
  } else {
    console.log("Admin role assigned successfully.");
  }

  // 3. Ensure user has a profile in user_profiles
  console.log("Ensuring user has a profile...");
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: user.id, full_name: 'Admin User', display_name: 'Admin' }, 
      { onConflict: 'user_id' }
    );
    
  if (profileError) {
    console.log("Note: Could not create user profile. Error:", profileError.message);
  } else {
    console.log("User profile ensured.");
  }

  console.log("\n=================================");
  console.log("ADMIN SETUP COMPLETE!");
  console.log(`Email:    ${TARGET_EMAIL}`);
  console.log(`Password: ${NEW_PASSWORD}`);
  console.log("=================================\n");
}

seedAdmin();
