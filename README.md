JavaScript Library Builder
==========================

这个工具为JavaScript基础库打包而设计，主要用于打包有如Java组织方式的JavaScript代码，并提供依赖管理和代码压缩等功能。

## 主要功能

0. 将分散开发的多个js文件打包合并成一个文件；
0. 根据依赖申明自动管理合并的先后顺序；
0. 提供外围闭包包装器，使用时可以在闭包内部替换所有实体（对应文件的类或方法）以点分隔的调用名称为一个整体串，以减少内部调用中的`.xxx`内存查找，同时在压缩时可以略微提高压缩率；
0. 提供多种配套的压缩工具，可以直接生成供产品使用的库脚本；

## 环境要求

* Web服务器
* PHP 5.3 以上支持
* Java 1.5 以上支持（可选，用于压缩）

## 使用方法

0. 下载所有项目代码，部署到你的Web服务器可访问的目录，并在同级新建两个目录：`temp`和`output`。如下结构：

		.
		|-- build/
		|   |-- jar/
		|   |-- js/
		|   |-- php/
		|   |-- config.js
		|   `-- index.html
		|-- temp/
		`-- output/

0. 将你需要打包的代码库如下放置（比如我要同时打包[jslib](http://github.com/elfjs/jslib)和[elf](http://github.com/elfjs/elf)）：

		.
		|-- build/
		|-- temp/
		|-- output/
		`-- repository/
		    |-- jslib/
			|   `-- src
			|       |-- js/
			|       |   |-- util/
			|       |   |   |-- Class.js
			|       |   |   |-- Type.js
			|       |   ...
			|       `-- js.js
		    `-- elf/
			    `-- src
			        |-- elf/
			        |   |-- ~namespace/...
			        |   `-- ~shortcut/...
			        `-- elf.js
	
	其中`src/`一层可以省略，这里仅作为个人习惯保留。

0. 所有需要打包的文件的互相依赖关系需要在文件内以如下语法声明：
	
		///import namespace.package.Class;
	
	工具会根据依赖的声明自动处理先后顺序，

0. 参照源码中的[config.js](https://github.com/elfjs/jslib-builder/blob/master/build/config.js)进行仓库配置：

		libpkr.BuildTool.config = {
			packages: {
			//	options: {
			//		title: '这个包是一个测试的包',  // 库名称标题
			//		path: 'a/path/string',          // 仓库相对于Web服务的绝对路径。
			//		hidden: false,                  // （可选）是否不开放此顶级命名空间，在要用到闭包包装器及与其他命名空间混合时可用。默认：false
			//		mixins: ['other', 'lib']        // （可选）是否以本库为基础混入其他命名空间的内容，同样要在启用闭包包装器时才可用。
			//	},
				js: {
					path: '/repository/jslib/src',
					title: 'jslib基础库，提供很多通用的基础核心工具类。'
				},
				elf: {
					path: '/repository/elf/src',
					title: '基于jslib进行了易用性封装的库外壳。',
					mixins: ['js']
				}
			}
		};

0. 在浏览器中访问之前部署的打包工具服务地址，例如：
	
		http://localhost/build/index.html
	
	然后在Web界面中勾选要打包的文件和操作其他需要的选项，点击“导出”按钮获取生成的文件。
	
	小技巧：在访问路径中加入`?debug=1`后，在导出时就可以看到每个文件打包过程的信息输出。

## 使用注意

* 该工具只提供打包功能，不提供语法检查功能，所以使用时必须基于提供源码的语法正确性。
* 所有代码中不能使用`$`开头的变量名，或任何符合/\$\w+/正则的串，这类串会被PHP当做变量造成打包错误。
* 模块树中：加粗表示用户主动选中的模块；“选中”表示肯定会被打包的模块；绿色背景表示会被依赖打包的模块。

## 帮助与支持

本工具属于自用实验性产品，未考虑众多异常情况处理，请尽量按照使用说明的步骤来使用。如有问题可以通过下列方式寻求支持：

0. 到elf+js项目的[讨论组](http://group.google.com/group/elfjs)发帖讨论；
0. 发邮件给elf+js项目邮件组：<elfjslib@gmail.com>；
0. 在github上[提交issue](https://github.com/elfjs/jslib-builder/issues)；
0. 直接[fork](https://github.com/elfjs/jslib-builder/fork_select)我们的代码帮助我们改进；
