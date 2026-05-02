export default async function handler(req, res) {
  return res.status(200).json({
    reply: "Hola, ¿en qué te puedo ayudar con tu surf?"
  });
}
