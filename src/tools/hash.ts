import { hash } from "../util/crypto";

// Main function to handle command line arguments
function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error("Usage: npx ts-node src/tools/hash.ts <unhashed password>");
        process.exit(1);
    }

    const unhashedPassword = args[0];
    const hashedPassword = hash(unhashedPassword);

    console.log(`Original: ${unhashedPassword}`);
    console.log(`Hashed: ${hashedPassword}`);
}

// Execute the main function
main();
