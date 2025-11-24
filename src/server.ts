import app from "./app";

const port = process.env.NEXT_PUBLIC_HTTP_PORT || 5001;

app.listen(port, () => {
  console.log(`Local server running on http://localhost:${port}`);
});
