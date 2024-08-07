/**
 * 由于各大服务商的语言代码都不大一样，
 * 所以我定义了一份 Bob 专用的语言代码，以便 Bob 主程序和插件之间互传语种。
 * Bob 语言代码列表 https://ripperhe.gitee.io/bob/#/plugin/addtion/language
 * 
 * 转换的代码建议以下面的方式实现，
 * `xxx` 代表服务商特有的语言代码，请替换为真实的，
 * 具体支持的语种数量请根据实际情况而定。
 * 
 * Bob 语言代码转服务商语言代码(以为 'zh-Hans' 为例): var lang = langMap.get('zh-Hans');
 * 服务商语言代码转 Bob 语言代码: var standardLang = langMapReverse.get('xxx');
 */

var items = [
    ['auto', 'auto'],
    ['zh-Hans', 'zh-Hans'],
    ['zh-Hant', 'zh-Hant'],
    ['en', 'en'],
];

var langMap = new Map(items);
var langMapReverse = new Map(items.map(([standardLang, lang]) => [lang, standardLang]));

function supportLanguages() {
    return items.map(([standardLang, lang]) => standardLang);
}

function formatResponse(data) {
    let formattedResults = [];

    data.forEach(entry => {
        if (entry.hwi && entry.hwi.hw && entry.fl && entry.shortdef) {
            let pronunciation = entry.hwi.prs ? entry.hwi.prs.map(pr => pr.mw).join(', ') : 'N/A';
            // Convert Merriam-Webster's pronunciation to standard IPA if necessary
            pronunciation = pronunciation.replace(/\\/g, '').replace(/\//g, '');

            let partOfSpeech = entry.fl;
            let definitions = entry.shortdef.map((def, index) => `${index + 1}. ${def}`).join('\n');

            formattedResults.push(`${entry.hwi.hw} \n${partOfSpeech} [C or U] /${pronunciation}/ \n${definitions}`);
        }
    });

    return formattedResults.join('\n\n');
}

function translate(query, completion) {
    const dictionaryApiKey = $option.dictionaryApiKey || "";
    const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(query.text)}?key=${dictionaryApiKey}`;

    $http.get({
        url: url,
        handler: function(resp) {
            if (resp.response.statusCode !== 200) {
                completion({
                    error: {
                        type: 'api_error',
                        message: 'Failed to fetch data from Merriam-Webster API.'
                    }
                });
                return;
            }

            const data = resp.data;
            if (data.length === 0) {
                completion({
                    error: {
                        type: 'no_result',
                        message: 'No results found.'
                    }
                });
                return;
            }

            let formattedResult = formatResponse(data);

            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: formattedResult.split('\n\n')
                }
            });
        }
    });
}

// 导出插件接口
module.exports = {
    supportLanguages: supportLanguages,
    translate: translate
};
