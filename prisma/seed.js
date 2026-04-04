async function main() {
  console.log(
    'Seeding is disabled. This project is configured to read tools from the existing MySQL database instead of inserting the old 6-tool fallback dataset.'
  )
}

main().catch(async (error) => {
  console.error('Database seed failed:', error)
  process.exit(1)
})
