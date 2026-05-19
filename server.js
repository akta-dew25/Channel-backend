import app from "./src/app.js";
import connectDb from "./src/config/db.js";

connectDb();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
