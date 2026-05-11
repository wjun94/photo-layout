# 智能照片排版工具 - 完整文档（v1.1.0 已新增A5/A6支持）

一个基于Node.js的高性能智能照片排版工具，支持将多张照片自动排版到标准纸张上，适用于证件照、生活照批量打印场景，特别适合打印店、照相馆和个人家庭使用。

## 功能特性

- ✅ **多尺寸支持**：支持1寸/小1寸/大1寸/2寸/3寸/4寸/5寸/6寸/7寸/8寸标准中国寸照尺寸
- ✅ **智能排版**：自动计算最优横排/竖排方式，最大化纸张利用率
- ✅ **全系列纸张支持**：支持A3/A4/A5/A6四种国际标准纸张尺寸
- ✅ **多输出格式**：支持JPG、PNG、PDF三种输出格式
- ✅ **批量处理**：支持glob模式批量导入照片，自动分页
- ✅ **多份打印**：支持单张照片多份打印，自动复制填充
- ✅ **精确裁剪线**：可添加四角裁剪线，方便后期精准裁切
- ✅ **批量重命名**：自动按规则重命名原始照片
- ✅ **水印功能**：支持文字水印和图片水印，可自定义位置、透明度、旋转角度
- ✅ **高度可配置**：可调整DPI、照片间距、页面边距、图片质量等所有参数
- ✅ **自动旋转**：自动旋转照片以获得最佳排版效果
- ✅ **无损裁剪**：自动居中裁剪照片，保持比例不变形

## 安装依赖

```bash
npm install sharp pdf-lib glob
```

## 快速开始

### 基础使用

```javascript
const { smartPhotoLayout } = require('./photo-layout')

async function basicExample() {
  try {
    const result = await smartPhotoLayout({
      inch: 2, // 2寸照片
      photoPaths: './photos/*.jpg', // 批量导入photos目录下所有jpg文件
      outputDir: './output', // 输出目录
      paperSize: 'a4', // 使用A4纸
      outputFormat: 'jpg',
      dpi: 300,
      photoSpacing: 2, // 照片之间留2mm间距
      pageMargin: 5, // 页面边距5mm
      quality: 98
    })

    console.log('生成的文件：', result)
  } catch (err) {
    console.error('排版失败：', err.message)
  }
}

basicExample()
```

### 运行脚本

```bash
node main.js
```

## 完整配置选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `inch` | number\|string | 必填 | 照片尺寸：1/1.5/2/3/4/5/6/7/8 或 '小1寸'/'大1寸' |
| `photoPaths` | string[]\|string | 必填 | 照片路径数组 或 glob模式（如'./photos/*.jpg'） |
| `outputDir` | string | 必填 | 输出文件目录 |
| `paperSize` | string | 'a4' | 纸张尺寸：'a3'/'a4'/'a5'/'a6'（大小写不敏感） |
| `outputFormat` | string | 'jpg' | 输出格式：'jpg'/'png'/'pdf' |
| `dpi` | number | 300 | 打印精度（DPI），建议300用于专业打印 |
| `photoSpacing` | number | 0 | 照片之间的间距（毫米） |
| `pageMargin` | number | 0 | 页面最小边距（毫米） |
| `forceRotate` | boolean\|null | null | 强制旋转：null=自动选择最优，true=强制横排，false=强制竖排 |
| `quality` | number | 98 | 图片质量（0-100），仅对JPG有效 |
| `copiesPerPhoto` | number | 1 | 每张照片打印的份数 |
| `addCropLines` | boolean | false | 是否添加裁剪线 |
| `cropLineLength` | number | 5 | 裁剪线长度（毫米） |
| `cropLineColor` | string | 'black' | 裁剪线颜色（支持颜色名称或十六进制） |
| `renamePhotos` | boolean | false | 是否批量重命名原始照片 |
| `renamePattern` | string | '{size}-{index}' | 重命名模式，支持{size}和{index}变量 |
| `watermark` | Object\|null | null | 水印配置，为null时不添加水印 |
| `watermark.type` | string | 'text' | 水印类型：'text'（文字）/'image'（图片） |
| `watermark.text` | string | '' | 文字水印内容 |
| `watermark.imagePath` | string | '' | 图片水印路径 |
| `watermark.position` | string | 'bottom-right' | 水印位置：'top-left'/'top-right'/'bottom-left'/'bottom-right'/'center' |
| `watermark.opacity` | number | 0.3 | 水印透明度（0-1） |
| `watermark.size` | number | 30 | 文字大小（像素）/图片缩放比例（%） |
| `watermark.rotate` | number | 0 | 水印旋转角度（度） |
| `watermark.color` | string | 'white' | 文字水印颜色 |

## 高级用法示例

### 1. 证件照多份打印（最常用场景）

```javascript
// 打印18张1寸证件照，刚好填满1页A4纸
await smartPhotoLayout({
  inch: 1,
  photoPaths: './my-id-photo.jpg', // 单张照片
  outputDir: './output/id-photos',
  paperSize: 'a4',
  outputFormat: 'pdf',
  dpi: 300,
  photoSpacing: 2,
  pageMargin: 5,
  copiesPerPhoto: 18, // 每张照片打印18份
  addCropLines: true, // 添加裁剪线方便裁切
  cropLineLength: 5,
  cropLineColor: 'gray'
})
```

### 2. A5纸便携打印（适合小型打印机）

```javascript
// A5纸打印8张1寸证件照，适合家用便携打印机
await smartPhotoLayout({
  inch: 1,
  photoPaths: './id-photo.jpg',
  outputDir: './output/a5-id-photos',
  paperSize: 'a5', // 使用A5纸
  outputFormat: 'pdf',
  dpi: 300,
  photoSpacing: 2,
  pageMargin: 5,
  copiesPerPhoto: 8,
  addCropLines: true
})
```

### 3. A6纸打印钱包照/明信片

```javascript
// A6纸打印4张3寸钱包照，刚好填满1页
await smartPhotoLayout({
  inch: 3,
  photoPaths: './wallet-photos/*.jpg',
  outputDir: './output/a6-wallet-photos',
  paperSize: 'a6', // 使用A6纸
  outputFormat: 'jpg',
  dpi: 300,
  photoSpacing: 1,
  pageMargin: 3
})
```

### 4. 添加文字水印

```javascript
await smartPhotoLayout({
  inch: 2,
  photoPaths: './photos/*.jpg',
  outputDir: './output/watermarked',
  paperSize: 'a4',
  outputFormat: 'jpg',
  dpi: 300,
  photoSpacing: 3,
  pageMargin: 10,
  watermark: {
    type: 'text',
    text: '仅供入职使用',
    position: 'center',
    opacity: 0.2,
    size: 60,
    rotate: -30,
    color: 'black'
  }
})
```

### 5. 添加图片水印

```javascript
await smartPhotoLayout({
  inch: 6,
  photoPaths: './vacation-photos/*.jpg',
  outputDir: './output/vacation',
  paperSize: 'a3', // 使用A3纸打印大尺寸照片
  outputFormat: 'jpg',
  dpi: 300,
  photoSpacing: 5,
  pageMargin: 10,
  watermark: {
    type: 'image',
    imagePath: './logo.png',
    position: 'bottom-right',
    opacity: 0.4,
    size: 15, // 缩放到纸张宽度的15%
    rotate: 0
  }
})
```

## 标准尺寸对照表

### 中国官方寸照尺寸（毫米）

| 尺寸名称 | 宽度(mm) | 高度(mm) | 常用场景 |
|----------|----------|----------|----------|
| 小1寸 | 22 | 32 | 驾驶证、体检表 |
| 标准1寸 | 25 | 35 | 一般证件照、简历照 |
| 大1寸 | 33 | 48 | 护照、港澳通行证、签证 |
| 标准2寸 | 35 | 49 | 毕业证、结婚证、学位证 |
| 3寸 | 55 | 87 | 钱包照、随身照 |
| 4寸 | 76 | 102 | 大3寸、生活照 |
| 5寸 | 89 | 127 | 标准生活照 |
| 6寸(4R) | 102 | 152 | 最常用照片打印尺寸 |
| 7寸(5R) | 127 | 178 | 放大照片、相框照 |
| 8寸(6R) | 152 | 203 | 大相框照片、摆台 |

### 国际标准纸张尺寸（毫米）

| 纸张尺寸 | 宽度(mm) | 高度(mm) | 像素(300DPI) | 常见用途 |
|----------|----------|----------|--------------|----------|
| A3 | 297 | 420 | 3508 × 4961 | 海报、大幅照片、批量打印 |
| A4 | 210 | 297 | 2480 × 3508 | 标准打印纸、证件照批量打印 |
| A5 | 148 | 210 | 1748 × 2480 | 便携打印机、小册子、少量打印 |
| A6 | 105 | 148 | 1240 × 1748 | 明信片、钱包照、随身打印 |

## 各纸张最大排版数量表
（无边距、300DPI、自动选择最优方向）

| 照片尺寸 | A3纸 | A4纸 | A5纸 | A6纸 |
|---------|------|------|------|------|
| 小1寸 | 126张(9×14) | 63张(7×9) | 30张(5×6) | 12张(3×4) |
| 1寸 | 108张(9×12) | 54张(6×9) | 24张(4×6) | 8张(2×4) |
| 大1寸 | 60张(6×10) | 30张(5×6) | 12张(3×4) | 4张(2×2) |
| 2寸 | 60张(6×10) | 30张(5×6) | 12张(3×4) | 4张(2×2) |
| 3寸 | 36张(4×9) | 18张(3×6) | 6张(2×3) | 2张(1×2) |
| 4寸 | 16张(4×4) | 8张(2×4) | 4张(2×2) | 1张 |
| 5寸 | 8张(2×4) | 4张(2×2) | 2张(1×2) | 1张 |
| 6寸 | 6张(2×3) | 4张(2×2) | 2张(1×2) | 1张 |
| 7寸 | 4张(2×2) | 2张(1×2) | 1张 | 无法放下 |
| 8寸 | 2张(1×2) | 1张 | 无法放下 | 无法放下 |

## 打印性价比分析（核心新增）

### 打印店常见价格参考（2026年国内市场）
| 纸张尺寸 | 彩色打印价格(元/张) | 黑白打印价格(元/张) |
|----------|---------------------|---------------------|
| A3 | 1.0-2.0 | 0.5-1.0 |
| A4 | 0.5-1.0 | 0.2-0.5 |
| A5 | 0.3-0.6 | 0.1-0.3 |
| A6 | 0.2-0.4 | 0.1-0.2 |

### 单张照片成本对比（按彩色打印中间价计算）
| 照片尺寸 | A3纸单张成本 | A4纸单张成本 | A5纸单张成本 | A6纸单张成本 | 性价比排名 |
|---------|--------------|--------------|--------------|--------------|------------|
| 小1寸 | 0.012元 | 0.012元 | 0.015元 | 0.025元 | 1 |
| 1寸 | 0.014元 | 0.014元 | 0.019元 | 0.038元 | 2 |
| 大1寸 | 0.025元 | 0.025元 | 0.038元 | 0.075元 | 3 |
| 2寸 | 0.025元 | 0.025元 | 0.038元 | 0.075元 | 3 |
| 3寸 | 0.042元 | 0.042元 | 0.075元 | 0.150元 | 5 |
| 4寸 | 0.094元 | 0.094元 | 0.113元 | 0.300元 | 6 |
| 5寸 | 0.188元 | 0.188元 | 0.225元 | 0.300元 | 7 |
| 6寸 | 0.250元 | 0.188元 | 0.225元 | 0.300元 | 7 |
| 7寸 | 0.375元 | 0.375元 | 0.450元 | - | 9 |
| 8寸 | 0.750元 | 0.750元 | - | - | 10 |

### 性价比结论与建议
1. **最高性价比组合**：**A4纸打印1寸/小1寸证件照**
   - 单张成本仅约0.01-0.02元，比单独打印1寸照便宜10-20倍
   - 打印店单独打印1寸照通常收费10-20元/版（8-9张），而自己排版打印A4仅需0.5-1元

2. **批量打印首选**：**A3纸**
   - 适合打印店或照相馆批量处理
   - 单张照片成本与A4相同，但一次可打印更多，提高效率

3. **少量打印首选**：**A5纸**
   - 适合个人少量打印（如只需要8张1寸照）
   - 避免浪费整张A4纸，同时成本仍较低
   - 大多数家用便携打印机都支持A5尺寸

4. **不推荐组合**：
   - A6纸打印任何尺寸照片：单张成本是A4的2-3倍
   - 单独打印5寸以上照片：自己排版打印A4/A3比直接冲印更便宜

5. **特殊场景建议**：
   - 证件照：永远选择A4/A3批量打印，成本最低
   - 生活照：6寸以下建议排版到A4打印，比单独冲印便宜
   - 7寸以上：可考虑直接冲印，因为排版后单张成本差距不大

## 常见问题

### Q: 为什么生成的照片模糊？
A: 确保原始照片分辨率足够高。建议：
- 1寸/2寸照片：至少600×800像素
- 5寸/6寸照片：至少1200×1800像素
- 打印DPI设置为300

### Q: 如何获得最佳排版效果？
A: 
- 适当设置`photoSpacing`（2-5mm）和`pageMargin`（5-10mm）
- 让工具自动选择旋转方向（`forceRotate: null`）
- 对于证件照，建议开启裁剪线（`addCropLines: true`）

### Q: 支持哪些图片格式作为输入？
A: Sharp库支持JPG、PNG、WebP、TIFF、GIF等常见图片格式。

### Q: 如何处理大量照片？
A: 使用glob模式批量导入，工具会自动分页处理。例如：
```javascript
photoPaths: './img/**/*.{jpg,jpeg,png}'
```

### Q: 生成的PDF文件太大怎么办？
A: 适当降低`quality`参数（如80-90），或先生成JPG再转换为PDF。

### Q: 不同打印机的边距要求不同怎么办？
A: 调整`pageMargin`参数，大多数打印机需要至少3-5mm的边距才能正常打印。

## 错误处理

工具会对输入参数进行严格验证，并抛出明确的错误信息：

- `仅支持尺寸：1寸/小1寸/大1寸/2寸/3寸/4寸/5寸/6寸/7寸/8寸`：检查`inch`参数
- `仅支持纸张尺寸：a3/a4/a5/a6（大小写不敏感）`：检查`paperSize`参数
- `请提供照片路径或glob模式`：`photoPaths`参数不能为空
- `请指定输出目录`：`outputDir`参数不能为空
- `打印份数必须是大于等于1的整数`：检查`copiesPerPhoto`参数
- `glob模式"xxx"没有匹配到任何照片文件`：检查文件路径是否正确
- `照片尺寸过大，无法在XX纸上放下（已设置XXmm边距）`：减小照片尺寸、减小边距或使用更大的纸张

## 性能优化建议

- 对于大量照片处理，建议分批处理
- 生成PDF时，适当降低图片质量可以显著减小文件大小
- 使用SSD硬盘可以提高处理速度
- 对于高分辨率照片，确保有足够的内存（建议至少4GB）
- 批量处理时，优先使用JPG输出格式，处理速度比PNG快3-5倍

## 更新日志

### v1.0.0 (2026-05-11)
- 初始版本发布
- 支持A6/A5/A4/A3纸张排版
- 支持多种标准寸照尺寸
- 添加裁剪线功能
- 添加批量重命名功能
- 添加文字/图片水印功能
- 支持单张照片多份打印
---
