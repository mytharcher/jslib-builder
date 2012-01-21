libpkr.BuildTool.config = {
	packages: {
//		options: {
//			path: 'a/path/string',
//			hidden: false,
//			mixins: ['other', 'lib'],
//			label: '这个包是一个测试的包'
//		},
		baidu: {
			path: '/Tangram-base/src',
			title: '百度Tangram基础库。'
		},
		js: {
			path: '/elfjs/jslib/src',
//			hidden: true,
			title: 'jslib基础库，提供很多通用的基础核心工具类。'
		},
		elf: {
			path: '/elfjs/elf/src',
			title: '基于jslib进行了易用性封装的库外壳。',
			mixins: ['js']
		},
		er: {
			path: '/ER/src',
			title: 'ER框架相关'
		},
		esui: {
			path: '/ER/src',
			title: 'esui组件库'
		}
		// esui: {
			// path: '/esui-elf/src',
			// title: '基于elf的esui组件库'
		// }
	}
};

//'js(path=/jslib/src&hidden=1),elf(path=/elfjs/src&mix=js)'
//package[]=js|path=/jslib/src&hidden=1
//package[]=elf|path=/elfjs/src&mix=js+etc