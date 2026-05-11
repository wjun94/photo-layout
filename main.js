const { smartPhotoLayout } = require('./photo-layout')

// ==============================================
// 使用示例（新增A5/A6纸张使用演示）
// ==============================================
async function main() {
  try {
    // 示例1：A5纸打印1寸证件照（适合便携打印机）
    const result = await smartPhotoLayout({
      inch: 6,
      photoPaths: './img/*.jpg',
      outputDir: './output',
      paperSize: 'a4', // 使用A5纸
      outputFormat: 'jpg',
      dpi: 300,
      photoSpacing: 2,
      pageMargin: 5,
      copiesPerPhoto: 8, // A5纸1寸照可放8张
      addCropLines: true,
      cropLineColor: 'gray'
    })

    // 示例2：A6纸打印小尺寸照片（明信片大小）
    // const result = await smartPhotoLayout({
    //   inch: 3,
    //   photoPaths: './wallet-photos/*.jpg',
    //   outputDir: './output/a6-wallet-photos',
    //   paperSize: 'a6', // 使用A6纸
    //   outputFormat: 'jpg',
    //   dpi: 300,
    //   photoSpacing: 1,
    //   pageMargin: 3
    // })

    console.log('\n📁 生成的文件：')
    result.forEach((file) => console.log(`  - ${file}`))
  } catch (err) {
    console.error('❌ 排版失败：', err.message)
  }
}

// 运行示例
main()