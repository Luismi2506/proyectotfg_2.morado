<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);
$message = $input["message"] ?? "";

$apiKey = "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";

$url = "https://api.groq.com/openai/v1/chat/completions";

$data = [
  "model" => "llama-3.1-8b-instant",
  "messages" => [
    ["role" => "user", "content" => $message]
  ],
  "temperature" => 0.7
];

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "Authorization: Bearer $apiKey"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo json_encode([
  "http_code" => $httpCode,
  "curl_error" => $error,
  "raw_response" => json_decode($response, true),
  "raw_text" => $response
]);