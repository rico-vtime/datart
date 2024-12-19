/*
 * Datart
 * <p>
 * Copyright 2021
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package datart.data.provider.freemarker;

import freemarker.cache.ClassTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.DigestUtils;

import java.io.IOException;
import java.io.StringWriter;
import java.util.*;

@Slf4j
public class FreemarkerContext {

    private static final Configuration conf;

    static {
        conf = new Configuration(Configuration.VERSION_2_3_31);
        //模板从字符串加载
        conf.setTemplateLoader(new StringTemplateLoader());
        // 使freemarker支持 null 值
        conf.setClassicCompatible(true);
    }

    public static String process(String content, Map<String, ?> dataModel) {
        String key = DigestUtils.md5DigestAsHex(content.getBytes());
        try {
            StringTemplateLoader.SCRIPT_MAP.put(key, content);
            Template template = conf.getTemplate(key);
            StringWriter writer = new StringWriter();
            template.process(dataModel, writer);
            return writer.toString();
        } catch (Exception e) {
            log.error("freemarker parse error", e);
        }
        return content;
    }


    public static void main(String[] args) throws IOException, TemplateException {
        // 创建 FreeMarker 配置对象
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
        // 假设模板位于项目的 classpath 下的 "templates" 文件夹中
        cfg.setTemplateLoader(new ClassTemplateLoader(FreemarkerContext.class, "/templates"));
        cfg.setDefaultEncoding("UTF-8");
        cfg.setLocale(java.util.Locale.CHINA);
        cfg.setTemplateExceptionHandler(freemarker.template.TemplateExceptionHandler.HTML_DEBUG_HANDLER);

        // Step 2: 加载模板
        Template template = cfg.getTemplate("test.ftl");
        // 准备数据
        HashSet<String> airlineCodes = new HashSet<>();
        airlineCodes.add("EU");
        airlineCodes.add("CA");

        HashSet<String> compareResult = new HashSet<>();
        // compareResult.add("全部");
        compareResult.add("优势");

        HashSet<String> resultValidFilters = new HashSet<>();
        // compareResult.add("全部");
        resultValidFilters.add("1");
        // 创建数据模型
        Map<String, Object> dataModel = new HashMap<>();
        dataModel.put("AIRLINE_CODE", airlineCodes);
        dataModel.put("COMPARE_RESULT", compareResult);
        // dataModel.put("RESULT_VALID_FILTER", resultValidFilters);
        dataModel.put("RESULT_VALID_FILTER", "0");

        // 合并数据模型和模板
        StringWriter writer = new StringWriter();
        template.process(dataModel, writer);

        // 输出结果
        System.out.println(writer.toString());
    }
}
