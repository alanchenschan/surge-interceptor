// 提取域名函数
function extractDomain(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // 移除端口号
    domain = domain.replace(/:\d+$/, '');
    
    // 移除 www 前缀
    domain = domain.replace(/^www\./, '');
    
    return domain;
  } catch (e) {
    console.log('URL解析错误: ' + e.message);
    return url;
  }
}

// 提取路径函数
function extractPath(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname.trim().replace(/^\/|\/$/g, '');
    
    if (!path) {
      return "";
    }
    
    const pathParts = path.split('/').filter(part => part.trim());
    return pathParts.join('-');
  } catch (e) {
    console.log('URL路径解析错误: ' + e.message);
    return "";
  }
}

// 获取当前日期和时间
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

// 获取请求和响应数据
let requestBody;
try {
  requestBody = JSON.parse($request.body);
} catch (e) {
  requestBody = {};
  console.log("请求体解析失败: " + e.message);
}

let responseBody;
try {
  responseBody = JSON.parse($response.body);
} catch (e) {
  responseBody = {};
  console.log("响应体解析失败: " + e.message);
}

// 检查是否是目标 API 请求
const requestURL = $request.url;
if (requestURL === "https://ahrefs.com/v4/stGetFreeBacklinksList") {
  try {
    // 从请求体中提取URL和模式
    const signedInput = requestBody.signedInput?.input || {};
    const url = signedInput.url || "";
    const mode = signedInput.mode || "subdomains";
    
    // 提取域名和路径
    const domain = extractDomain(url);
    const path = extractPath(url);
    
    // 构建文件名
    const timestamp = getCurrentDateTime();
    const filename = path ? 
      `${domain}-${mode}-${path}-backlinks` : 
      `${domain}-${mode}-backlinks`;
    
    // 使用 Surge 的 $persistentStore 保存数据
    const storageKey = `ahrefs_${timestamp}_${filename}`;
    $persistentStore.write(JSON.stringify(responseBody), storageKey);
    
    console.log(`已保存数据: ${storageKey}`);
    
    // 通过通知提示用户
    $notification.post(
      "Ahrefs 反向链接数据已保存", 
      `已成功拦截并保存 ${domain} 的反向链接数据`,
      `存储键: ${storageKey}`
    );
  } catch (e) {
    console.log(`处理响应时出错: ${e.message}`);
    $notification.post(
      "Ahrefs 数据保存失败", 
      `处理响应时出错`,
      e.message
    );
  }
}

// 不修改响应，原样返回
$done({});
