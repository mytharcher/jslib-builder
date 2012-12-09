libpkr.BuildTool.config = {
	packages: {
//		options: {
//			path: 'a/path/string',
//			hidden: false,
//			mixins: ['other', 'lib'],
//			label: '这个包是一个测试的包'
//		},
		js: {
			path: '/repository/jslib/src',
//			hidden: true,
			title: 'jslib基础库，提供很多通用的基础核心工具类。'
		},
		elf: {
			path: '/repository/elf/src',
			title: '基于jslib进行了易用性封装的库外壳。',
			mixins: ['js']
		},
		er: {
			path: '/repository/er/src',
			title: 'ER框架(标准版)'
		},
		esui: {
			path: '/repository/er/src',
			title: 'esui组件库(标准版)'
		},
		baidu: {
			path: '/repository/tangram/src',
			title: '百度Tangram基础库。'
		}
	},
	
	hideConfig: 1
};

//'js(path=/jslib/src&hidden=1),elf(path=/elfjs/src&mix=js)'
//package[]=js|path=/jslib/src&hidden=1
//package[]=elf|path=/elfjs/src&mix=js+etc