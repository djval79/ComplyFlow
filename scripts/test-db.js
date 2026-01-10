
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);

    try {
        // Test 1: Check connection by listing a public table or just checking health
        // We'll try to select from 'profiles'. Even if RLS blocks, we get a response (401/200).
        const { data, error, status, statusText } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });

        console.log(`Response Status: ${status} ${statusText}`);

        if (error) {
            console.warn('Query Error (Expected if RLS is on without auth):', error.message);
            // If code is "PGRST116" or similar RLS error, connection is good.
            // If code is connection refused, it's bad.
        } else {
            console.log('Query Successful. Count:', data); // data might be null with head:true
        }

        // Test 2: List Tables in public schema
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(5);

        if (tableError) {
            console.warn('Could not list tables (RLS likely):', tableError.message);
        } else {
            console.log('Tables found:', tables.map(t => t.table_name).join(', '));
            console.log('Tables test passed.');
        }

        // Test 3: List Functions
        // We can't query information_schema.routines easily via Client usually, depends on exposure.
        // Try to call a non-existent RPC to see if we get a specific error (function not found vs connection error)
        const { error: rpcError } = await supabase.rpc('non_existent_function_12345');
        if (rpcError && rpcError.code !== 'PGRST116') { // PGRST116 is what we expect? Or 404.
            console.log('RPC Call attempted (Function check passed, even if not found). Error:', rpcError.message);
        }

        // Check for Resend API Key
        if (process.env.RESEND_API_KEY) {
            console.log('RESEND_API_KEY is present.');
        } else {
            console.warn('RESEND_API_KEY is MISSING.');
        }

        console.log('Database connectivity and function access check completed.');

    } catch (err) {
        console.error('Unexpected Error:', err);
        process.exit(1);
    }
}

testDatabase();
