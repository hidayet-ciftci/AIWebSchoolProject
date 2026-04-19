$baseUrl = "http://127.0.0.1:5000"
$uniqueId = Get-Random -Maximum 1000000
$teacherEmail = "teacher$uniqueId@test.com"
$studentEmail = "student$uniqueId@test.com"
$password = "Password123!"

function Invoke-Api {
    param($method, $path, $body, $token)
    $headers = @{"Content-Type" = "application/json"}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{
        Uri = "$baseUrl$path"
        Method = $method
        Headers = $headers
    }
    if ($body) { $params["Body"] = $body | ConvertTo-Json }
    try {
        return Invoke-RestMethod @params
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
             $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
             $details = $reader.ReadToEnd()
             $errorMsg += " | Server: $details"
        }
        throw $errorMsg
    }
}

try {
    Write-Host "--- 1 & 2: Register ---"
    $teacherReg = Invoke-Api "POST" "/api/users/register" @{email=$teacherEmail; password=$password; role="teacher"; name="Teacher Name"}
    $studentReg = Invoke-Api "POST" "/api/users/register" @{email=$studentEmail; password=$password; role="student"; name="Student Name"}
    Write-Host "Registration: Success"

    Write-Host "--- 3: Login ---"
    $teacherLogin = Invoke-Api "POST" "/api/users/login" @{email=$teacherEmail; password=$password}
    $studentLogin = Invoke-Api "POST" "/api/users/login" @{email=$studentEmail; password=$password}
    $teacherToken = $teacherLogin.token
    $studentToken = $studentLogin.token
    $teacherId = $teacherLogin.user.id
    $studentId = $studentLogin.user.id
    Write-Host "Login: Success"

    Write-Host "--- 4: Create Course ---"
    $course = Invoke-Api "POST" "/api/courses/create" @{name="Physics 101"; teacherId=$teacherId; studentIds=@($studentId)} -token $teacherToken
    $courseId = $course.id
    Write-Host "Course Create: Success (ID: $courseId)"

    Write-Host "--- 5: Upload File ---"
    $filePath = "tmp/rag-e2e-material.txt"
    if (-not (Test-Path "tmp")) { New-Item -ItemType Directory -Path "tmp" -Force | Out-Null }
    "Newton'un ikinci yasasi, bir cisim uzerindeki net kuvvetin, o cismin kutlesi ile ivmesinin carpimina esit oldugunu belirtir (F=ma)." | Out-File $filePath -Encoding UTF8
    
    $uploadResult = curl.exe -s -X POST "$baseUrl/api/courses/$courseId/upload" `
        -H "Authorization: Bearer $teacherToken" `
        -F "file=@$filePath" `
        -F "title=RAG E2E Material"
    
    if ($uploadResult -match "error") { Write-Host "Upload Error: $uploadResult" }
    else { Write-Host "Upload: Success" }

    Write-Host "--- 6: Poll for status ---"
    $status = "pending"
    for ($i=0; $i -lt 12; $i++) {
        Start-Sleep -Seconds 3
        $courseData = Invoke-Api "GET" "/api/courses/$courseId" -token $teacherToken
        $material = $courseData.materials | Where-Object { $_.title -eq "RAG E2E Material" } | Select-Object -First 1
        $status = $material.status
        Write-Host "Material Status: $status"
        if ($status -eq "ready" -or $status -eq "failed") { break }
    }

    Write-Host "--- 7: Chat ---"
    if ($status -eq "ready") {
        $chatResponse = Invoke-Api "POST" "/chat" @{message="Newtonun ikinci yasasi nedir?"; courseId=$courseId} -token $studentToken
        Write-Host "rag.used: $($chatResponse.rag.used)"
        Write-Host "reason: $($chatResponse.rag.reason)"
        Write-Host "sourceCount: $($chatResponse.rag.sources.Count)"
        Write-Host "reply: $($chatResponse.reply)"
    } else {
        Write-Host "Skipping chat because material status is $status"
    }

    Write-Host "--- 9: Cleanup ---"
    Invoke-Api "DELETE" "/api/courses/delete/$courseId" -token $teacherToken
    Write-Host "Cleanup: Success"
} catch {
    Write-Host "An error occurred: $_"
}
