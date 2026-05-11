const sharp = require('sharp')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const fs = require('fs').promises
const path = require('path')
const glob = require('glob')

/**
 * 智能照片排版到A3/A4/A5/A6纸（终极完整版）
 * @param {Object} options 配置选项
 * @param {number|string} options.inch 照片尺寸：1/1.5/2/3/4/5/6/7/8 或 '小1寸'/'大1寸'
 * @param {string[]|string} options.photoPaths 照片路径数组 或 glob模式（如'./photos/*.jpg'）
 * @param {string} options.outputDir 输出目录
 * @param {string} [options.paperSize='a4'] 纸张尺寸：'a3'/'a4'/'a5'/'a6'（大小写不敏感）【已新增A5/A6】
 * @param {string} [options.outputFormat='jpg'] 输出格式：jpg/png/pdf
 * @param {number} [options.dpi=300] 打印精度
 * @param {number} [options.photoSpacing=0] 照片之间的间距（毫米）
 * @param {number} [options.pageMargin=0] 页面最小边距（毫米）
 * @param {boolean|null} [options.forceRotate=null] 强制旋转：null=自动，true=横排，false=竖排
 * @param {number} [options.quality=98] 图片质量（0-100）
 * @param {number} [options.copiesPerPhoto=1] 每张照片打印的份数（特别适用于单张照片多份打印）
 * // 新增功能2：添加裁剪线
 * @param {boolean} [options.addCropLines=false] 是否添加裁剪线
 * @param {number} [options.cropLineLength=5] 裁剪线长度（毫米）
 * @param {string} [options.cropLineColor='black'] 裁剪线颜色
 *
 * // 新增功能3：批量重命名
 * @param {boolean} [options.renamePhotos=false] 是否批量重命名照片
 * @param {string} [options.renamePattern='{size}-{index}'] 重命名模式
 *
 * // 新增功能4：水印添加
 * @param {Object|null} [options.watermark=null] 水印配置
 * @param {string} [options.watermark.type='text'] 水印类型：'text'/'image'
 * @param {string} [options.watermark.text=''] 文字水印内容
 * @param {string} [options.watermark.imagePath=''] 图片水印路径
 * @param {string} [options.watermark.position='bottom-right'] 位置：top-left/top-right/bottom-left/bottom-right/center
 * @param {number} [options.watermark.opacity=0.3] 透明度（0-1）
 * @param {number} [options.watermark.size=30] 文字大小/图片缩放比例（%）
 * @param {number} [options.watermark.rotate=0] 旋转角度（度）
 * @param {string} [options.watermark.color='white'] 文字颜色
 *
 * @returns {Promise<string[]>} 生成的文件路径数组
 */
async function smartPhotoLayout(options) {
  // 默认配置
  const config = {
    outputFormat: 'jpg',
    dpi: 300,
    photoSpacing: 0,
    pageMargin: 0,
    forceRotate: null,
    quality: 98,
    chromaTolerance: 0.1,
    copiesPerPhoto: 1,
    paperSize: 'a4', // 默认使用A4纸
    addCropLines: false,
    cropLineLength: 5,
    cropLineColor: 'black',
    renamePhotos: false,
    renamePattern: '{size}-{index}',
    watermark: null,
    ...options,
  }

  // 输入验证
  const {
    inch,
    photoPaths,
    outputDir,
    paperSize,
    outputFormat,
    dpi,
    photoSpacing,
    pageMargin,
    forceRotate,
    quality,
    copiesPerPhoto,
    addCropLines,
    cropLineLength,
    cropLineColor,
    renamePhotos,
    renamePattern,
    watermark,
  } = config

  // 支持的尺寸列表
  const validSizes = [1, 1.5, 2, 3, 4, 5, 6, 7, 8, '小1寸', '大1寸']
  if (!validSizes.includes(inch)) {
    throw new Error('仅支持尺寸：1寸/小1寸/大1寸/2寸/3寸/4寸/5寸/6寸/7寸/8寸')
  }

  // 【修改1】新增A5/A6纸张验证
  const validPaperSizes = ['a3', 'a4', 'a5', 'a6']
  const normalizedPaperSize = paperSize.toLowerCase()
  if (!validPaperSizes.includes(normalizedPaperSize)) {
    throw new Error('仅支持纸张尺寸：a3/a4/a5/a6（大小写不敏感）')
  }

  if (!photoPaths) {
    throw new Error('请提供照片路径或glob模式')
  }

  if (!outputDir) {
    throw new Error('请指定输出目录')
  }

  // 打印份数验证
  if (!Number.isInteger(copiesPerPhoto) || copiesPerPhoto < 1) {
    throw new Error('打印份数必须是大于等于1的整数')
  }

  // 标准寸照尺寸（毫米，中国官方打印标准）
  const sizeMap = {
    1: { w: 25, h: 35 }, // 标准1寸（单寸）
    小1寸: { w: 22, h: 32 }, // 驾驶证、体检表
    大1寸: { w: 33, h: 48 }, // 护照、港澳通行证
    2: { w: 35, h: 49 }, // 标准2寸
    3: { w: 55, h: 87 }, // 钱包照
    4: { w: 76, h: 102 }, // 大3寸
    5: { w: 89, h: 127 }, // 标准5寸
    6: { w: 102, h: 152 }, // 标准6寸（4R）
    7: { w: 127, h: 178 }, // 7寸（5R）
    8: { w: 152, h: 203 }, // 8寸（6R）
  }

  // 【修改2】新增A5/A6标准纸张尺寸（毫米，国际ISO 216标准）
  const paperSizeMap = {
    a3: { w: 297, h: 420 },
    a4: { w: 210, h: 297 },
    a5: { w: 148, h: 210 }, // 新增：A5尺寸（半张A4）
    a6: { w: 105, h: 148 }, // 新增：A6尺寸（半张A5，明信片大小）
  }

  // 颜色映射
  const colorMap = {
    red: { r: 255, g: 0, b: 0 },
    blue: { r: 67, g: 142, b: 219 },
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
  }

  // 获取选择的纸张尺寸
  const paper = paperSizeMap[normalizedPaperSize]
  const paperName = normalizedPaperSize.toUpperCase()

  // 毫米转像素
  const mm2px = (mm) => Math.round((mm * dpi) / 25.4)

  // 原始照片尺寸
  const origWmm = sizeMap[inch].w
  const origHmm = sizeMap[inch].h
  const sizeName = typeof inch === 'number' ? `${inch}寸` : inch

  // ==============================================
  // 核心算法：计算最优排版方式
  // ==============================================
  function calculateLayout(photoW, photoH) {
    // 可用空间 = 纸张尺寸 - 2*页面边距
    const availableW = paper.w - 2 * pageMargin
    const availableH = paper.h - 2 * pageMargin

    // 计算每行/每列最多能放多少张（包含间距）
    const cols = Math.floor((availableW + photoSpacing) / (photoW + photoSpacing))
    const rows = Math.floor((availableH + photoSpacing) / (photoH + photoSpacing))

    return {
      cols: Math.max(0, cols),
      rows: Math.max(0, rows),
      count: Math.max(0, cols * rows),
      photoW,
      photoH,
    }
  }

  // 计算两种方向的排版结果
  const verticalLayout = calculateLayout(origWmm, origHmm) // 竖排
  const horizontalLayout = calculateLayout(origHmm, origWmm) // 横排

  // 选择最优排版
  let bestLayout
  let needRotate

  if (forceRotate !== null) {
    // 强制旋转模式
    needRotate = forceRotate
    bestLayout = forceRotate ? horizontalLayout : verticalLayout
    console.log(`📌 强制${forceRotate ? '横排' : '竖排'}模式`)
  } else {
    // 自动选择能放更多张的方向
    if (horizontalLayout.count > verticalLayout.count) {
      bestLayout = horizontalLayout
      needRotate = true
      console.log(
        `📌 自动选择【横排】，单页可放${bestLayout.count}张（竖排仅${verticalLayout.count}张）`,
      )
    } else {
      bestLayout = verticalLayout
      needRotate = false
      console.log(
        `📌 自动选择【竖排】，单页可放${bestLayout.count}张（横排仅${horizontalLayout.count}张）`,
      )
    }
  }

  if (bestLayout.count === 0) {
    throw new Error(`照片尺寸过大，无法在${paperName}纸上放下（已设置${pageMargin}mm边距）`)
  }

  const { cols, rows, count: perPageCount, photoW: pWmm, photoH: pHmm } = bestLayout

  // 转换为像素
  const pW = mm2px(pWmm)
  const pH = mm2px(pHmm)
  const paperW = mm2px(paper.w)
  const paperH = mm2px(paper.h)
  const spacingPx = mm2px(photoSpacing)
  const marginPx = mm2px(pageMargin)
  const cropLineLengthPx = mm2px(cropLineLength)

  // 计算居中偏移量
  const totalUsedW = cols * pW + (cols - 1) * spacingPx
  const totalUsedH = rows * pH + (rows - 1) * spacingPx
  const offsetX = marginPx + Math.floor((paperW - 2 * marginPx - totalUsedW) / 2)
  const offsetY = marginPx + Math.floor((paperH - 2 * marginPx - totalUsedH) / 2)

  // 生成所有照片位置坐标
  const positions = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        left: offsetX + c * (pW + spacingPx),
        top: offsetY + r * (pH + spacingPx),
      })
    }
  }

  console.log(`✅ 最终排版：${cols}列 × ${rows}行 = ${paperName}纸单页最多${perPageCount}张`)

  // ==============================================
  // 处理glob模式，自动获取照片
  // ==============================================
  let allPhotos
  if (typeof photoPaths === 'string') {
    // 如果传入的是glob字符串，自动匹配文件
    allPhotos = glob.sync(photoPaths, {
      nodir: true,
      absolute: false,
    })

    if (allPhotos.length === 0) {
      throw new Error(`glob模式"${photoPaths}"没有匹配到任何照片文件`)
    }
  } else {
    // 如果传入的是数组，直接使用
    allPhotos = photoPaths
  }

  // 单张照片多份打印
  if (copiesPerPhoto > 1) {
    console.log(`\n📄 正在复制照片，每张打印${copiesPerPhoto}份...`)
    const expandedPhotos = []

    allPhotos.forEach((photoPath, index) => {
      for (let i = 0; i < copiesPerPhoto; i++) {
        expandedPhotos.push(photoPath)
      }
    })

    allPhotos = expandedPhotos
    console.log(`✅ 照片复制完成，总照片数：${allPhotos.length}`)
  }

  console.log(
    `📄 总照片数：${allPhotos.length}，将生成${Math.ceil(allPhotos.length / perPageCount)}页`,
  )

  // ==============================================
  // 批量重命名照片
  // ==============================================
  if (renamePhotos) {
    console.log('\n🔄 正在批量重命名照片...')
    const renamedDir = path.join(outputDir, '原始照片-已重命名')
    await fs.mkdir(renamedDir, { recursive: true })

    const renamedPhotos = []
    for (let i = 0; i < allPhotos.length; i++) {
      const ext = path.extname(allPhotos[i])
      const newName =
        renamePattern
          .replace('{size}', sizeName)
          .replace('{index}', String(i + 1).padStart(3, '0')) + ext
      const newPath = path.join(renamedDir, newName)

      await fs.copyFile(allPhotos[i], newPath)
      renamedPhotos.push(newPath)
      console.log(`  ✅ ${path.basename(allPhotos[i])} → ${newName}`)
    }

    allPhotos = renamedPhotos
    console.log('✅ 批量重命名完成')
  }

  // ==============================================
  // 分页处理
  // ==============================================
  const outputFiles = []
  const totalPages = Math.ceil(allPhotos.length / perPageCount)

  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true })

  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * perPageCount
    const endIdx = Math.min(startIdx + perPageCount, allPhotos.length)
    const pagePhotos = allPhotos.slice(startIdx, endIdx)

    console.log(`\n🖨️ 正在生成第${page + 1}/${totalPages}页...`)

    // 创建空白画布
    let canvas = sharp({
      create: {
        width: paperW,
        height: paperH,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })

    const composites = []

    // 处理每张照片
    for (let i = 0; i < pagePhotos.length; i++) {
      const photoPath = pagePhotos[i]
      const pos = positions[i]

      try {
        // 检查文件是否存在
        await fs.access(photoPath)

        let img = sharp(photoPath)

        // 自动旋转照片内容
        if (needRotate) {
          img = img.rotate(90)
        }

        // 自动居中裁剪，不变形
        const processedImg = await img
          .resize(pW, pH, {
            fit: 'cover',
            position: 'center',
            withoutEnlargement: false, // 允许放大小图片填满
          })
          .toBuffer()

        composites.push({
          input: processedImg,
          left: pos.left,
          top: pos.top,
        })

        console.log(`  ✅ 处理照片 ${i + 1}/${pagePhotos.length}: ${path.basename(photoPath)}`)
      } catch (err) {
        console.error(`  ❌ 处理照片失败 ${photoPath}:`, err.message)
      }
    }

    // ==============================================
    // 添加裁剪线
    // ==============================================
    if (addCropLines) {
      console.log('  📏 正在添加裁剪线...')
      let cropLinesSvg = `<svg width="${paperW}" height="${paperH}" xmlns="http://www.w3.org/2000/svg">`
      const lineColor = cropLineColor === 'black' ? '#000000' : cropLineColor

      positions.forEach((pos) => {
        const x1 = pos.left
        const y1 = pos.top
        const x2 = pos.left + pW
        const y2 = pos.top + pH

        // 左上角
        cropLinesSvg += `<line x1="${x1}" y1="${y1}" x2="${x1 + cropLineLengthPx}" y2="${y1}" stroke="${lineColor}" stroke-width="1"/>`
        cropLinesSvg += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1 + cropLineLengthPx}" stroke="${lineColor}" stroke-width="1"/>`

        // 右上角
        cropLinesSvg += `<line x1="${x2}" y1="${y1}" x2="${x2 - cropLineLengthPx}" y2="${y1}" stroke="${lineColor}" stroke-width="1"/>`
        cropLinesSvg += `<line x1="${x2}" y1="${y1}" x2="${x2}" y2="${y1 + cropLineLengthPx}" stroke="${lineColor}" stroke-width="1"/>`

        // 左下角
        cropLinesSvg += `<line x1="${x1}" y1="${y2}" x2="${x1 + cropLineLengthPx}" y2="${y2}" stroke="${lineColor}" stroke-width="1"/>`
        cropLinesSvg += `<line x1="${x1}" y1="${y2}" x2="${x1}" y2="${y2 - cropLineLengthPx}" stroke="${lineColor}" stroke-width="1"/>`

        // 右下角
        cropLinesSvg += `<line x1="${x2}" y1="${y2}" x2="${x2 - cropLineLengthPx}" y2="${y2}" stroke="${lineColor}" stroke-width="1"/>`
        cropLinesSvg += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y2 - cropLineLengthPx}" stroke="${lineColor}" stroke-width="1"/>`
      })

      cropLinesSvg += '</svg>'

      composites.push({
        input: Buffer.from(cropLinesSvg),
        left: 0,
        top: 0,
      })
    }

    // ==============================================
    // 添加水印
    // ==============================================
    if (watermark) {
      console.log('  💧 正在添加水印...')
      let watermarkImg

      if (watermark.type === 'text') {
        // 文字水印
        const fontSize = watermark.size || 30
        const textColor = watermark.color || 'white'
        const svg = `<svg width="${paperW}" height="${paperH}" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="50%" font-size="${fontSize}" fill="${textColor}" 
                text-anchor="middle" dominant-baseline="middle" 
                opacity="${watermark.opacity || 0.3}"
                transform="rotate(${watermark.rotate || 0}, ${paperW / 2}, ${paperH / 2})">
            ${watermark.text || ''}
          </text>
        </svg>`
        watermarkImg = Buffer.from(svg)
      } else if (watermark.type === 'image') {
        // 图片水印
        const scale = (watermark.size || 30) / 100
        watermarkImg = await sharp(watermark.imagePath)
          .resize(Math.round(paperW * scale), Math.round(paperH * scale), { fit: 'inside' })
          .rotate(watermark.rotate || 0)
          .composite([
            {
              input: Buffer.from(
                `<svg><rect width="100%" height="100%" fill="white" opacity="${1 - (watermark.opacity || 0.3)}"/></svg>`,
              ),
              blend: 'over',
            },
          ])
          .toBuffer()
      }

      if (watermarkImg) {
        // 计算水印位置
        let left, top
        const wmWidth = (await sharp(watermarkImg).metadata()).width
        const wmHeight = (await sharp(watermarkImg).metadata()).height

        switch (watermark.position || 'bottom-right') {
          case 'top-left':
            left = marginPx
            top = marginPx
            break
          case 'top-right':
            left = paperW - wmWidth - marginPx
            top = marginPx
            break
          case 'bottom-left':
            left = marginPx
            top = paperH - wmHeight - marginPx
            break
          case 'bottom-right':
            left = paperW - wmWidth - marginPx
            top = paperH - wmHeight - marginPx
            break
          case 'center':
            left = (paperW - wmWidth) / 2
            top = (paperH - wmHeight) / 2
            break
        }

        composites.push({
          input: watermarkImg,
          left: Math.round(left),
          top: Math.round(top),
        })
      }
    }

    // 合成图片
    const outputFileName = `${normalizedPaperSize}-${sizeName}-第${page + 1}页.${outputFormat}`
    const outputPath = path.join(outputDir, outputFileName)

    if (outputFormat === 'pdf') {
      // 生成PDF
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([paperW, paperH])

      // 将sharp生成的图片嵌入PDF
      const jpgBuffer = await canvas.composite(composites).jpeg({ quality }).toBuffer()

      const jpgImage = await pdfDoc.embedJpg(jpgBuffer)
      page.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: paperW,
        height: paperH,
      })

      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(outputPath, pdfBytes)
    } else {
      // 生成图片
      await canvas.composite(composites).toFormat(outputFormat, { quality }).toFile(outputPath)
    }

    outputFiles.push(outputPath)
    console.log(`✅ 第${page + 1}页生成完成: ${outputPath}`)
  }

  console.log(`\n🎉 全部完成！共生成${outputFiles.length}个文件`)
  return outputFiles
}

module.exports = {
  smartPhotoLayout,
}
