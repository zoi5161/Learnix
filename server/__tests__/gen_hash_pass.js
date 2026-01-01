const bcrypt = require('bcryptjs');

async function main() {
  const password = "aloalo";

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  console.log("result:", hash);
}

main();