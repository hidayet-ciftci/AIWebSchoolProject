$ErrorActionPreference = 'Stop'

$baseUrl = 'http://127.0.0.1:5000'
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$password = 'TestPass123!'
$teacherEmail = "rag-e2e-teacher-$timestamp@example.com"
$studentEmail = "rag-e2e-student-$timestamp@example.com"
$filePath = Join-Path $PSScriptRoot 'rag-e2e-material.txt'

function Write-Step($label, $data) {
  Write-Host "`n=== $label ==="
  if ($null -ne $data) {
    $data | ConvertTo-Json -Depth 8
  }
}

function Invoke-Json($method, $uri, $body, $headers = @{}) {
  return Invoke-RestMethod -Method $method -Uri $uri -ContentType 'application/json' -Body (($body | ConvertTo-Json -Depth 8)) -Headers $headers
}

$teacherRegisterBody = @{
  name = 'Rag'
  surname = 'Teacher'
  age = 30
  gender = 'male'
  email = $teacherEmail
  password = $password
  role = 'teacher'
}
$studentRegisterBody = @{
  name = 'Rag'
  surname = 'Student'
  age = 20
  gender = 'female'
  email = $studentEmail
  password = $password
  role = 'student'
}

$teacherRegister = Invoke-Json 'POST' "$baseUrl/auth/register" $teacherRegisterBody
$studentRegister = Invoke-Json 'POST' "$baseUrl/auth/register" $studentRegisterBody
Write-Step 'Teacher register' @{ email = $teacherEmail; id = $teacherRegister.user._id; message = $teacherRegister.message }
Write-Step 'Student register' @{ email = $studentEmail; id = $studentRegister.user._id; message = $studentRegister.message }

$teacherLogin = Invoke-Json 'POST' "$baseUrl/auth/login" @{ email = $teacherEmail; password = $password }
$studentLogin = Invoke-Json 'POST' "$baseUrl/auth/login" @{ email = $studentEmail; password = $password }
$teacherToken = $teacherLogin.accessToken
$studentToken = $studentLogin.accessToken
Write-Step 'Teacher login' @{ ok = [bool]$teacherToken; role = $teacherLogin.user.role }
Write-Step 'Student login' @{ ok = [bool]$studentToken; role = $studentLogin.user.role }

$courseCreate = Invoke-Json 'POST' "$baseUrl/api/courses/create" @{
  name = "RAG E2E Course $timestamp"
  courseCode = "RAG-$timestamp"
  teacher = $teacherRegister.user._id
  students = @($studentRegister.user._id)
  lessonNumber = 2
  source = 'E2E test'
  status = 'active'
}
$courseId = $courseCreate.createdCourse._id
Write-Step 'Course create' @{ id = $courseId; name = $courseCreate.createdCourse.name }

$uploadHeaders = @{
  Authorization = "Bearer $teacherToken"
}
$uploadCommand = @(
  'curl.exe',
  '-s',
  '-X', 'POST',
  '-H', "Authorization: Bearer $teacherToken",
  '-F', "title=RAG E2E Material",
  '-F', "file=@$filePath;type=text/plain",
  "$baseUrl/api/courses/$courseId/upload"
)
$uploadJson = & $uploadCommand[0] $uploadCommand[1..($uploadCommand.Length - 1)]
if (-not $uploadJson) {
  throw 'Upload returned empty response.'
}
$uploadResult = $uploadJson | ConvertFrom-Json
Write-Step 'Upload result' @{ queueStatus = $uploadResult.queueStatus; message = $uploadResult.message }

$materialStatus = $null
$materialId = $null
for ($attempt = 1; $attempt -le 12; $attempt++) {
  Start-Sleep -Seconds 2
  $course = Invoke-RestMethod -Method GET -Uri "$baseUrl/api/courses/$courseId"
  $latestMaterial = $course.materials | Select-Object -Last 1
  if ($null -ne $latestMaterial) {
    $materialStatus = $latestMaterial.status
    $materialId = $latestMaterial._id
    Write-Step "Poll $attempt" @{ status = $materialStatus; chunksCount = $latestMaterial.chunksCount; indexingError = $latestMaterial.indexingError }
    if ($materialStatus -eq 'ready' -or $materialStatus -eq 'failed') {
      break
    }
  }
}

if ($materialStatus -ne 'ready') {
  throw "Material did not become ready. Final status: $materialStatus"
}

$chatHeaders = @{ Authorization = "Bearer $studentToken" }
$chatResult = Invoke-Json 'POST' "$baseUrl/chat" @{ message = 'Newtonun ikinci yasasi nedir?'; courseId = $courseId } $chatHeaders
Write-Step 'Chat result' @{ reply = $chatResult.reply; rag = $chatResult.rag }

try {
  $deleteHeaders = @{ Authorization = "Bearer $teacherToken" }
  $deleteResult = Invoke-RestMethod -Method DELETE -Uri "$baseUrl/api/courses/$courseId/materials/$materialId" -Headers $deleteHeaders
  Write-Step 'Material cleanup' @{ ok = $true; message = $deleteResult.message }
} catch {
  Write-Step 'Material cleanup' @{ ok = $false; error = $_.Exception.Message }
}

try {
  $courseDelete = Invoke-RestMethod -Method DELETE -Uri "$baseUrl/api/courses/delete/$courseId"
  Write-Step 'Course cleanup' @{ ok = $true; message = $courseDelete.message }
} catch {
  Write-Step 'Course cleanup' @{ ok = $false; error = $_.Exception.Message }
}
