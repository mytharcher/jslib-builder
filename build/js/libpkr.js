elf.util.Namespace.get('libpkr.DependTree', this, elf.util.Class.create({
	constructor: function (args) {
		elf().copy(args, this);
		elf().on(args.wrapId, 'click', this._oncheck.bind(this), this._oncheckFilter);
		elf().on(args.wrapId, 'click', this._onexpand, this._onexpandFilter);
	},
	
	_onexpand: function (ev) {
		elf().toggleClass(this.parentNode.parentNode, 'expand');
		ev.stopPropagation();
	},
	
	_onexpandFilter: function (node) {
		return elf().hasClass(node.parentNode, 'class-item-title')
			&& elf().hasClass(node.parentNode.parentNode, 'item folder');
	},
	
	_oncheck: function (ev) {
		ev.stopPropagation();
		ev.stopAll();
		
		var target = ev.target;
		if (target.type != 'checkbox') {
			return;
		}
		
		this.checkLinkedItem(target);
		
		elf().toggleClass(this._getItemNodeByValue(target.value), 'chosen', target.checked);
		
//		if (target.checked) {
//			var checkedGroup = new elf.util.Set();
//			elf.util.XArray.toArray(
//				document.querySelectorAll('input[checkbox]', this.getWrap())
//			).forEach(this._inputCheckedFilter, checkedGroup);
//			
//			this.checkLinkedItem(target, checkedGroup);
//		} else {
//			
//		}
		
		this.onCheckItem && this.onCheckItem();
	},
	
	_oncheckFilter: function (node) {
		return elf().hasClass(node, 'item-checkbox');
	},
	
	_inputCheckedFilter: function (item) {
		item.checked && this.add(item.value);
	},
	
	_dependItemCheck: function (value) {
		var itemNode = this._getItemNodeByValue(value);
		if (itemNode) {
			var itemCheckInput = this._getCheckItemByValue(value);
			//当前项的依赖列表
			var dependItems = elf.dom.Selector.queryAll('input[type=hidden]', itemNode.firstChild);
			var dependValues = dependItems.map(function (item) {return item.value;});
			
			//当前项的被依赖情况
			var dependency = this.dependMap[value] || (this.dependMap[value] = new elf.util.Set());
			var isDependent = !dependency.isEmpty();
			//当前项是选中或被其他项依赖时
			var opKey = itemCheckInput.checked || isDependent ? 'add' : 'remove';
			
			if (!itemCheckInput.checked) {
				elf().removeClass(itemNode, 'chosen');
			}
			
			//对当前项的依赖列表遍历
			dependItems.forEach(function (item) {
				var itemDependency = this.dependMap[item.value]
					|| (this.dependMap[item.value] = new elf.util.Set());
				itemDependency[opKey](value);
				
				var dependItem = this._getItemNodeByValue(item.value);
				if (dependItem) {
					elf()[itemDependency.isEmpty() ? 'removeClass' : 'addClass'](dependItem, 'depends');
				}
				
				
				this._dependItemCheck(item.value);
			}, this);
		}
	},
	
	checkLinkedItem: function (checkInput) {
		var value = checkInput.value,
			itemNode = this._getItemNodeByValue(value),
			checkGroup = [checkInput];
		
		if (itemNode.getAttribute('data-type') == 'folder') {
			checkGroup = elf.dom.Selector.queryAll('input.item-checkbox', itemNode);
		}
		
		checkGroup.forEach(this._checkItemsInPackage, {
			me: this,
			checked: checkInput.checked
		});
		
//		elf.dom.Selector.queryAll('li.item.chosen>div.class-item-title fieldset input[type="hidden"]', this.getWrap())
//			.forEach(function (item) {
//				this.dependMap.add(item.value);
//			}, this);
	},
	
	checkItemByValues: function (modules) {
		for (var i = 0, len = modules.length; i < len; i++) {
			var checkInput = elf().g('Class_' + modules[i]);
			if (checkInput && checkInput.value) {
				checkInput.checked = true;
				elf().addClass(this._getItemNodeByValue(checkInput.value), 'chosen');
				this.checkLinkedItem(checkInput);
			}
		}
	},
	
	_checkItemsInPackage: function (item) {
		var me = this.me;
		item.checked = this.checked;
		me.checkedSet[this.checked ? 'add' : 'remove'](item.value);
		
		me._dependItemCheck(item.value);
	},
	
	_getItemNodeByValue: function (value) {
		return document.getElementById('CheckNode_' + value);
	},
	
	_getCheckItemByValue: function (value) {
		return document.getElementById('Class_' + value);
	},
	
	createHTML: function (list, level) {
		var list = list || this.data, html = [];
		if (!elf.util.Type.isArray(list)) {
			html.push('<ul class="item-group">');
			for (var i in list) {
				if (list.hasOwnProperty(i)) {
					html.push(this._eachMapCreateItemHTML(list[i], i, level));
				}
			}
			html.push('</ul>');
		}
		return html.join('');
	},
	
	_eachMapCreateItemHTML: function (item, i, level) {
		var name = i || this.TPL_ROOT_DEFAULT_TITLE,
			level = level || '',
			fullname = level ? level + '.' + i : i,
			dependHTML = item.dependency && item.dependency.length ? 
				elf.text.Template.format(this.TPL_DEPEND_WRAP, item.dependency.sort()
					.map(this._eachFormatDependItem, this).join('')) : '',
			detailHTML = this._createItemInfoHTML(item.info),
			titleHTML = elf.text.Template.format(this.TPL_ITEM_TITLE, {
				name: name,
				fullname: fullname || '',
				type: item.type,
				detail: elf.text.Template.format(this.TPL_DETAIL_WRAP, detailHTML, dependHTML)
			});
		var html = elf.text.Template.format(this.TPL_ITEM, {
			type: elf.util.Type.isArray(item.children) ? 'file' : 'folder',
			expand: this.defaultExpand ? ' expand' : '',
			level: level,
			fullname: fullname,
			title: titleHTML,
			children: this.createHTML(item.children, fullname)
		});
		return html;
	},
	
	_eachFormatDependItem: function (item, i, array) {
		return elf.text.Template.format(this.TPL_DEPEND_ITEM, item);
	},
	
	_createItemInfoHTML: function (info) {
		var html = [];
		if (info) {
			info['class'] && html.push(this._createItemInfoItemHTML('类名', info['class']));
			info.singleton && html.push(this._createItemInfoItemHTML('单例', '是'));
			info.description && html.push(this._createItemInfoItemHTML('', info.description));
		}
		var text = html.join('');
		return text ? elf.text.Template.format(this.TPL_DETAIL_LIST_WRAP, text) : '';
	},
	
	_createItemInfoItemHTML: function (data) {
		return arguments.length ? elf.text.Template.format(this.TPL_DESCRIPTION_ITEM, arguments) : '';
	},
	
	/**
	 * 获取已选择对象列表的外部接口
	 * @param {Boolean} depends
	 * 
	 * @return {Array}
	 */
	getCheckedList: function (depends) {
		var ret = elf.dom.Selector.queryAll('input[type=checkbox]', this.getWrap()).filter(function (checkbox) {
			return checkbox.value && checkbox.checked;
		}).map(function (item) {
			return item.value;
		});
		
		if (depends) {
			ret = elf.util.XArray.distinct(
				ret.concat(this.getDependList())
			).sort();
		}
		
		return ret;
	},
	
	getChosenList: function () {
		var ret = elf.dom.Selector.queryAll('li.item.chosen>div.class-item-title input[type=checkbox]', this.getWrap()).map(function (item) {
			return item.value;
		});
		return ret;
	},
	
	getDependList: function () {
		return Object.keys(this.dependMap).filter(function (item) {
			return !this[item].isEmpty();
		}, this.dependMap);
	},
	
	updateData: function (data) {
		this.data = data.children ? {'': data} : data;
		this.dependMap = {};
		this.checkedSet = new elf.util.Set();
		var html = this.createHTML();
		this.getWrap().innerHTML = html;
	},
	
	getWrap: function () {
		return elf().g(this.wrapId);
	},
	
	TPL_ITEM: '<li id="CheckNode_#{fullname}" class="item #{type}#{expand}" data-level="#{level}" data-fullname="#{fullname}" data-type="#{type}">'
		+ '#{title}#{children}</li>',
	TPL_ITEM_TITLE: '<div class="class-item-title">'
			+ '<p>'
				+ '<label for="Class_#{fullname}" class="item-checkbox">'
					+ '<input type="checkbox" name="modules" id="Class_#{fullname}" value="#{fullname}" class="item-checkbox" />#{name}'
				+ '</label>'
			+ '</p>'
			+ '#{detail}'
		+ '</div>',
	TPL_ROOT_DEFAULT_TITLE: '<em>(All trunk)</em>',
	TPL_DETAIL_WRAP: '<fieldset class="class-detail"><legend>详细信息</legend>#{0}#{1}</fieldset>',
	TPL_DETAIL_LIST_WRAP: '<dl>#{0}</dl>',
	TPL_DESCRIPTION_ITEM: '<dt>#{0}</dt><dd>#{1}</dd>',
	TPL_DEPEND_WRAP: '<div class="class-depend"><h4>依赖</h4><ul>#{0}</ul></div>',
	TPL_DEPEND_ITEM: '<li class="class-dependency-item"><input type="hidden" value="#{0}" disabled="disabled" />#{0}</li>',
	
	DATA_TREE_EXAMPLE_SINPLE: {
		elf: {
			util: {
				Class: [],
				Type: [],
				Shortcut: ['elf.util.Type']
			}
		}
	},
	DATA_TREE_EXAMPLE: {
		'': {
			children: {
				'elf': {
					children: {
						'util': {
							children: {
								'Class': {
									dependency: []
								},
								'Type': {
									children: {
										'~Element': {},
										'~Document': {},
										'~Window': {}
									}
								}
							}
						},
						'dom': {
							children: {
								'children': {
									children: []
								}
							}
						}
					}
				}
			}
		}
	}
}));

elf.util.Namespace.get('libpkr.ItemList', this, elf.util.Class.create({
	constructor: function (args) {
		elf().copy(this.constructor.config, this);
		elf().copy(args, this);
	},
	
	updateData: function (data) {
		this.data = data;
		var html = this.createHTML();
		this.getWrap().innerHTML = html;
	},
	
	createHTML: function (withWrap) {
		var html = this.data.map(this.createItemHTML, this).join('');
		
		return withWrap ? elf.text.Template.format(this.tplWrap, html) : html;
	},
	
	createItemHTML: function (item, i, list) {
		return elf.text.Template.format(this.tplItem, item);
	},
	
	getWrap: function () {
		return document.getElementById(this.wrapId);
	},
	
	dataAdapter: {
		//for example:
//		'title': 'itemTitle'
	}
}));

elf.util.Class.copy({
	config: {
		tplWrap: '<ul class="ui-list">#{0}</ul>',
		tplItem: '<li class="ui-list-item">#{title}</li>'
	}
}, libpkr.ItemList);



/**
 * 
 * @param {Object} config
 */
elf.util.Namespace.get('libpkr.RepoConfig', this, {
	initialize: function (args) {
		var me = this;
		
		elf.util.Class.copy(args, this);
		
		this.configDialog = new o2lab.lib.Dialog({
			moduleId: 'RepositoryConfigDialog',
			backgroundId: 'AbsBackground',
			center: true
		});
		
		this.repoList = new libpkr.ItemList({
			wrapId: 'RepositoryConfigList',
			tplItem: '<li label="#{namespace}">'
				+ '<aside><button type="button" class="item-delete-button close-button" title="移除该库">x</button></aside>'
				+ '<p>'
				+ '<span class="item-namespace#{mixinClass}#{hiddenClass}">#{namespace}</span>'
				+ '<label>仓库路径：</label><span class="item-path">#{path}</span>'
				+ '#{mixins}'
				+ '</p></li>',
			mixinItemTpl: '<span class="mixin-item">#{0}</span>',
			createItemHTML: function (item, i, list) {
				var hiddenClass = item.hidden ? ' item-hidden' : '',
					mixinClass = item.mixins && item.mixins.length ? ' item-mixined' : '';
				var data = {
					namespace: item.namespace,
					path: item.path,
					mixins: item.mixins && item.mixins.length ? '，混入的包：[<span class="item-mixin-list">' + item.mixins.map(this.createMixinItemHTML, this) + ']</span>' : '',
					mixinClass: mixinClass,
					hiddenClass: hiddenClass
				};
				return elf.text.Template.format(this.tplItem, data);
			},
			
			createMixinItemHTML: function (item) {
				return elf.text.Template.format(this.mixinItemTpl, item);
			}
		});
		
		elf().on('ChangeConifgBtn', 'click', this._onshowconfig);
		
		elf().on('RepositoryConfigList', 'click', this._onremoverepository, this._removeMixinItemFilter);
		
		if (elf().g('RepositoryConfigAddForm')) {
			this.configTab = new o2lab.lib.TabSwitch({
				wrapId: 'RepositoryConfigTabWrap'
			});
			
			this.addForm = new o2lab.lib.AjaxForm({
				formId: 'RepositoryConfigAddForm',
				submitForm: function(){
					var data = this.getFormData().get();
					if (/^\w+$/.test(data.namespace)) {
						me.config.packages[data.namespace] = {
							hidden: data.hidden,
							path: data.path,
							mixins: data.mixins ? data.mixins instanceof Array ? data.mixins : [data.mixins] : []
						};
						me.updatePackages();
						me.configTab.switchByIndex(0);
						
						this.getForm().reset();
					}
					return false;
				},
				onReset: function(){
					me.configTab.switchByIndex(0);
				}
			});
		
			elf().on('RepositoryConfigAddItemMixins', 'click', this._addMixinItem);
			
			elf().on('RepositoryConfigAddMixinItemList', 'click', function () {
				var item = this.parentNode,
					list = item.parentNode;
				if (list.childNodes.length > 1) {
					list.removeChild(item);
				} else {
					item.firstChild.value = '';
				}
				item = list = null;
			}, this._removeMixinItemFilter);
		}
		
		this.listForm = new o2lab.lib.AjaxForm({
			formId: 'RepositoryConfigModifyForm',
			submitForm: function () {
				me.onConfigModified && me.onConfigModified();
				me.configDialog.hide();
				return false;
			}
		});
	},
	
	_onshowconfig: function () {
		libpkr.RepoConfig.show();
	},
	
	_addMixinItem: function (ev) {
		var last = this.parentNode.firstChild.lastChild;
		var input = last.firstChild;
		if (input.value) {
			var newOne = last.cloneNode(true);
			last.parentNode.appendChild(newOne);
//			elf(function () {
				newOne.firstChild.value = '';
//			});
		}
	},
	
	_onremoverepository: function (ev) {
		var item = this.parentNode.parentNode,
			list = item.parentNode;
		delete libpkr.RepoConfig.config.packages[item.getAttribute('label')];
		list.removeChild(item);
		item = list = null;
	},
	
	_removeMixinItemFilter: function (node) {
		return elf().hasClass(node, 'item-delete-button');
	},
	
	show: function () {
		libpkr.RepoConfig.configDialog.show();
	},
	
	updatePackages: function () {
		var packages = this.config.packages;
		var packs = Object.keys(packages).map(function (item) {
			this[item].namespace = item;
			return this[item];
		}, packages);
		
		this.repoList.updateData(packs);
	}
});



elf.util.Namespace.get('libpkr.BuildTool', this, {
	'': elf(function () {
		var me = libpkr.BuildTool;
		me.classTree = new libpkr.DependTree({
			wrapId: 'ClassStructure',
			defaultExpand: true
		});
		
		me.selectedList = new libpkr.ItemList({
			wrapId: 'ExportList',
			tplItem: '<input type="hidden" name="includes[]" value="#{0}" />'
		});
		
		me.importedRepoList = new libpkr.ItemList({
			wrapId: 'ImportRepoList',
			tplItem: '<span title="#{title}" class="#{nameClass} #{typeClass}">#{namespace}</span>',
			createItemHTML: function (item, i, list) {
				var types = [];
				item.hidden && types.push(this.hiddenTypeClass);
				item.mixins && item.mixins.length && types.push(this.mixinedTypeClass);
				var data = {
					title: item.title,
					typeClass: types.join(' '),
					namespace: item.namespace,
					nameClass: this.namespaceClass,
					path: item.path
				};
				return elf.text.Template.format(this.tplItem, data);
			},
			hiddenTypeClass: 'item-hidden',
			mixinedTypeClass: 'item-mixined',
			namespaceClass: 'item-namespace'
		});
		
		if (elf().g('RepositoryConfigDialog')) {
			me.repoConfig = libpkr.RepoConfig;
			me.repoConfig.initialize({
				config: me.config,
				onConfigModified: me.loadList.bind(me)
			});
		}
		
		me.consolePanel = new o2lab.lib.Dialog({
			moduleId: 'ConsoleLogDialog'
		});
		
		me.helpPanel = new o2lab.lib.Dialog({
			moduleId: 'HelpDialog'
		});
		
		elf().on('HelpSwitchBtn', 'click', me._ontogglehelp);
		
		me.buildForm = new o2lab.lib.AjaxForm({
			formId: 'ExportForm',
			submitForm: function () {
				var includeList = me.classTree.getCheckedList(elf().g('AutoDependRadio').checked);
				if (!includeList.length) {
					alert(libpkr.BuildTool.TEXT_ERROR_NO_CLASS_CHECKED);
					return false;
				}
				me.selectedList.updateData(includeList);
				
				var data = this.getFormData();
				var submitType = data.get('exportType');
				submitType = submitType === null ? 1 : parseInt(submitType);
				
				if (!submitType) {
					var myForm = this.getForm();
					elf.net.Ajax.load({
						url: myForm.action,
						method: myForm.method || elf.net.Ajax.HTTP_POST,
						data: data,
						onsuccess: me._onexport
					});
				}
				
				return !!submitType;
			}
		});
		
		var url = new elf.net.URL(location);
		elf().g('ConsoleLogHidden').value = url.getParameter('debug');
		
		elf().on('RepositoryConfigNotifyCheck', 'click', me._onswitchnotify);
		
		elf().on('SaveConfigBtn', 'click', me._onsaveconfig);
		
		elf().on('ClearConfigBtn', 'click', me._onclearconfig);
		
		me.loadConfig();
	}),
	
	_onexport: function (output) {
		var me = libpkr.BuildTool;
		var consolePanel = elf().g('ConsoleContent');
		consolePanel.innerHTML = output;
		if (output && parseInt(elf().g('ConsoleLogHidden').value)) {
			me.consolePanel.show();
		}
	},
	
	_configSavingFilter: function (key) {
		var map = {
			'includes[]': false
		},
			ret = map[key];
		return elf.util.Type.isDefined(ret) ? ret : true;
	},
	
	/**
	 * 保存设置的事件处理
	 * @param {Event} ev
	 */
	_onsaveconfig: function (ev) {
		var me = libpkr.BuildTool;
		var data = o2lab.lib.AjaxForm.getFormData(elf().g('ExportForm')).get();
		data.modules = me.classTree.getChosenList().join();
//		console.log(JSON.stringify(data));
		me.saveCookie(data);
		alert(libpkr.BuildTool.TEXT_INFO_SAVE_CONGIF);
	},
	
	/**
	 * @private
	 * @param {Event} ev
	 */
	_onclearconfig: function (ev) {
		var me = libpkr.BuildTool;
		if (confirm(me.TEXT_WARN_CLEAR_CONFIG)) {
			me.clearConfig();
		}
	},
	
	_onswitchnotify: function (ev) {
		var data = {};
		data[this.name] = this.checked + 0;
		libpkr.BuildTool.saveCookie(data);
	},
	
	_ontogglehelp: function (ev) {
		libpkr.BuildTool.helpPanel.show();
	},
	
	/**
	 * 从cookie中加载配置
	 */
	loadConfig: function () {
		var data = elf.dom.Cookie.get();
		
		if (elf().isString(data.hideConfig)) {
			data.hideConfig = !!parseInt(data.hideConfig);
		}
		if (elf().isString(data.packages)) {
			data.packages = JSON.parse(data.packages || '{}');
		}
		if (elf().isString(data.modules)) {
			data.modules = data.modules.split(',');
		}
		if (elf().isString(data.useClosure)) {
			data.useClosure = !!parseInt(data.useClosure);
		}
		if (elf().isString(data.exportDepend)) {
			data.exportDepend = !!parseInt(data.exportDepend);
		}
		
		elf.util.Class.copy(data, this.config);
		
		this.setConfig();
	},
	
	/**
	 * 保存设置到cookie中
	 * @param {Object} data
	 */
	saveCookie: function (data, options) {
		elf.util.Class.copy(data, this.config);
		var d = elf.util.Class.mix({}, this.config, this._configSavingFilter);
		if (elf().isObject(d.packages)) {
			d.packages = JSON.stringify(d.packages);
		}
		elf.dom.Cookie.set(d, options || this.cookieOption);
	},
	
	/**
	 * 根据配置进行设置
	 */
	setConfig: function () {
		if (this.repoConfig) {
			this.repoConfig.updatePackages();
			
			var notifyCheck = elf().g('RepositoryConfigNotifyCheck');
			notifyCheck.checked = this.config[notifyCheck.name];
		}
		
		o2lab.lib.AjaxForm.setFormData(elf().g('ExportForm'), this.config);
		
		if (this.config.hideConfig) {
			this.loadList();
		} else {
			this.repoConfig && this.repoConfig.show();
		}
	},
	
	/**
	 * 清除保存的设置
	 */
	clearConfig: function () {
		elf.dom.Cookie.clear();
	},
	
	/**
	 * 加载
	 */
	loadList: function () {
		var me = this,
			data = new elf.net.URLParameter(),
			importedListData = [],
			packages = this.config.packages;
		
		for (var i in packages) {
			packages[i].namespace = i;
			data.add(this.NAME_TRUNK_KEY, packages[i].path);
			importedListData.push(packages[i]);
		}
		
		this.importedRepoList.updateData(importedListData);
		
		elf().g('ExportPackagesHidden').value = JSON.stringify(packages);
		
		elf.net.Ajax.get({
			url: this.URL_GET_LIST,
			data: data,
			responseType: elf.net.Ajax.DATA_TYPE_JSON,
			onsuccess: function (list) {
				me.classTree.updateData(list);
				var modules = me.config.modules;
				modules && modules.length && me.classTree.checkItemByValues(modules);
			}
		});
	},
	
	cookieOption: {
		last: 30 * 24 * 60 * 60 * 1000
	},
	
	URL_GET_LIST: './php/get_class_list_json.php',
	NAME_TRUNK_KEY: 'trunk[]',
	TEXT_WARN_CLEAR_CONFIG: '您确定要清空所有自定义配置吗？',
	TEXT_INFO_SAVE_CONGIF: '保存设置成功！',
	TEXT_ERROR_NO_CLASS_CHECKED: '请至少选择一个类或对象。'
});