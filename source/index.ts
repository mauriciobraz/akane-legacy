async function main(): Promise<void> {
  console.log("Hello world!");
}

if (require.main === module) {
  main();
}
