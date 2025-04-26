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

// 获取当前日期
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 主要处理函数
const targetEndpoints = ["stGetFreeBacklinksOverview", "stGetFreeBacklinksList"];

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
if (requestURL.startsWith("https://ahrefs.com/v4/")) {
    const urlParts = requestURL.split('/');
    const endpoint = urlParts[urlParts.length - 1];

    if (targetEndpoints.includes(endpoint)) {
        try {
            let url, mode, domain, path, filename;

            if (endpoint === "stGetFreeBacklinksOverview") {
                url = requestBody.url || "";
                mode = requestBody.mode || "subdomains";

                domain = extractDomain(url);
                path = extractPath(url);

                filename = path ?
                    `${domain}-${mode}-${path}-stGetFreeBacklinksOverview` :
                    `${domain}-${mode}-stGetFreeBacklinksOverview`;
            }
            else if (endpoint === "stGetFreeBacklinksList") {
                const signedInput = requestBody.signedInput?.input || {};
                url = signedInput.url || "";
                mode = signedInput.mode || "subdomains";

                domain = extractDomain(url);
                path = extractPath(url);

                filename = path ?
                    `${domain}-${mode}-${path}-stGetFreeBacklinksList` :
                    `${domain}-${mode}-stGetFreeBacklinksList`;
            }

            // 获取当前日期
            const today = getCurrentDate();

            // 使用 Surge 的 $persistentStore 保存数据
            const storageKey = `ahrefs_${today}_${filename}`;
            $persistentStore.write(JSON.stringify(responseBody), storageKey);

            console.log(`已保存数据: ${storageKey}`);

            // 通过通知提示用户
            $notification.post(
                "Ahrefs 数据已保存",
                `已成功拦截并保存 ${endpoint} 数据`,
                `文件: ${filename}`
            );
        } catch (e) {
            console.log(`处理响应时出错: ${e.message}`);
        }
    }
}

// 不修改响应，原样返回
$done({});
