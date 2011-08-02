<?php
class ContentBuffer {
	static private $instance = null;
	
	private $buffer = array();
	
	private function getInstance() {
		if (self::$instance == null) {
			self::$instance = new ContentBuffer();
		}
		return self::$instance;
	}
	
	private function __construct() {}
	private function __clone() {}
	
	static public function push($content) {
		array_push(self::getInstance()->buffer, $content);
	}
	
	static public function output() {
		echo join("\n", self::getInstance()->buffer);
	}
	
	static public function clean() {
		self::getInstance()->buffer = array();
	}
	
	static public function clean_out() {
		self::output();
		self::clean();
	}
}

function parse_source($file, &$flagMap, &$options) {
	$content = '';
	
	$needDepend = $options['exportDepend'];
	$inList = isset($flagMap[$file]);
	
	if (!$inList || !$flagMap[$file]) {
		ContentBuffer::push('<li>');
		
		if (file_exists($file) && ($content = file_get_contents($file))) {
			$content .= "\r\n\r\n";
			
			$flagMap[$file] = true;
			
		
			if (preg_match_all("/(\/{3}import ([\w\.~-]+);?)\s/", $content, $matches, PREG_SET_ORDER)) {
				ContentBuffer::push('<ul>');
				
				if ($inList || $needDepend) {
					foreach($matches as $token) {
						$subFileName = get_file_path_by_class_name($token[2], $options);//"$baseDir/" . str_replace('.', '/', $token[2]) . '.js';
						
						$subContent = parse_source($subFileName, $flagMap, $options);
						
						$reg = "|" . str_replace('.', '\.', $token[1]) . "\s|";
						
						$content = preg_replace($reg, str_replace('\\', '\\\\', $subContent), $content);
					}
					
					//$content = parse_dependency($matches, $content, $flagMap, $options);
					//$content = parse_content($matches, $content, $flagMap, $options);
				} else {
					$subContents = array();
					foreach($matches as $token) {
						$subFileName = get_file_path_by_class_name($token[2], $options);//"$baseDir/" . str_replace('.', '/', $token[2]) . '.js';
						
						$subContents[] = parse_source($subFileName, $flagMap, $options);
					}
					$content = join('', $subContents);
				}
				//$content && ContentBuffer::push("<li><strong>$file</strong> <em>$inList</em><br />$content</li>");
				ContentBuffer::push('</ul>');
			} else {
				if (!$inList && !$needDepend) {
					$content = '';
				}
			}
			
			if ($inList || $needDepend) {
				ContentBuffer::push("$file <span style='font-weight:bold; color:blue;'>OK</span>");
			} else {
				ContentBuffer::push("$file <span style='font-weight:bold; color:orange;'>Not imported</span>");
			}
				/*
				if (preg_match_all("/(\/{3}import ([\w\.~-]+);?)\s/", $content, $matches, PREG_SET_ORDER)) {
					ContentBuffer::push('<ul>');
					foreach($matches as $token) {
						$subFileName = get_file_path_by_class_name($token[2], $options);//"$baseDir/" . str_replace('.', '/', $token[2]) . '.js';
						
						//if ($needDepend) {
							$subContent = parse_source($subFileName, $flagMap, $options);
							
							//$flagMap = $subContent['addedList'];
							
							$reg = "|" . str_replace('.', '\.', $token[1]) . "\s|";
							//echo $reg;
							$content = preg_replace($reg, str_replace('\\', '\\\\', $subContent), $content);
						//}
					}
					ContentBuffer::push('</ul>');
				}
				ContentBuffer::push("$file <span style='font-weight:bold; color:blue;'>OK</span>");
				*/
		} else {
			$pkgDir = substr($file, 0, strlen($file) - 3);
			if (is_dir($pkgDir)) {
				ContentBuffer::push("$pkgDir <span style='font-weight:bold; color:#ee0;'>(directory)</span>");
			} else {
				ContentBuffer::push("$file <span style='font-weight:bold; color:red;'>Fail</span>");
			}
		}
		ContentBuffer::push('</li>');
	}
	
	return $content;
}


/**
 * @param {Array} &$options
 */
function merge_file(&$options) {
	$list = get_file_list_to_merge($options);
	$flagMap = array();
	
	ContentBuffer::push('<style>
#ConsoleContent ul{margin:0; padding:0;}
#ConsoleContent li{list-style:none; margin:10px; padding:5px; border:1px solid #ccc; background:#f7f7f7;}
</style>');
	
	foreach($list as $file) {
		ContentBuffer::push("$file<br />");
		$flagMap[$file] = false;
	}
	
	$fileContentList = array();
	foreach($list as $file) {
		if (!$flagMap[$file]) {
			//echo "<strong>$file</strong><br>";
			ContentBuffer::push('<ul>');
			$result = parse_source($file, $flagMap, $options);
			ContentBuffer::push('</ul>');
			
			$fileContentList[] = $result;
			
			//$flagMap = $result['addedList'];
			
			//$fileContentList[] = $result['content'];
		}
	}
	
	$temp = preg_replace("|[\r\n]{1,2}|is", "\r\n", implode('', $fileContentList));
	
	return $temp;
}

/**
 * 
 */
function get_file_list_to_merge(&$options) {
	$list = array();
	if (isset($options['includes'])) {
		foreach($options['includes'] as $item) {
			$file = get_file_path_by_class_name($item, $options);
			if ($file) {
				$list[] = $file;
			}
		}
	}
	return $list;
}

/**
 * 通过类名获取文件路径
 */
function get_file_path_by_class_name($class_name, &$options) {
	$ret = false;
	if ($class_name) {
		$class_array = explode('.', $class_name);
		$pack = $class_array[0];
		$package = $options['packages'][$pack];
		$baseDir = $options['baseDir'];
		if (isset($package)) {
			$ret = $baseDir . $package['path'] . '/' . implode('/', $class_array) . '.js';
		}
	}
	return $ret;
}

/**
 * 模板替换
 */
/*
function template($tpl, $data) {
	return preg_replace_callback("|#\{(\w+)\}|i", function ($matches) use ($data) {
		return $data[$matches[1]];
	}, $tpl);
}
*/

function replace_dot($item) {
	return str_replace('.', '_$_', $item);
}

function filter_abstract($item) {
	return strpos($item, '~') === false && $item != '';
}

function get_entity_list($list) {
	return array_filter($list, "filter_abstract");
}

function get_short_list($list) {
	return array_map("replace_dot", get_entity_list($list));
}

/**
 * 外包闭包
 */
function closure_wrap(&$content, $options) {
	$list = $options['includes'];
	
	$json = create_structure_json($list, $options);
	$json_content = json_encode($json);
	$json_content = replace_short_json($json_content, $list);
	
	$data = array(
		'packages' => $options['packages'],
		'varList' => implode(",\n", get_short_list($list)),
		'scriptContent' => $content,
		'jsonStructure' => $json,
		'jsonContent' => $json_content
	);
	
	ob_start();
	ob_implicit_flush(false);
	require('wrap.js.php');
	$wrap = ob_get_clean();
	
	/*
	if ($wrap = file_get_contents('./wrap.tpl.js')) {
		$data = array(
			'varList' => join(",\n", get_short_list($list)),
			'scriptContent' => $content,
			'structureJSON' => create_structure_json($list, $options)
		);
		
		if (preg_match_all("/\/\*@([^@]+)?@\*\//", $wrap, $matches, PREG_SET_ORDER)) {
			foreach($matches as $token) {
				$wrap = str_replace($token[0], template($token[1], $data), $wrap);
			}
		}
	}
	*/
	return $content = $wrap ? short_replace($wrap, $list) : $content;
}

/**
 * 替换文件内容中的命名空间为直接变量名
 */
function short_replace($content, $list) {
	usort($list, function ($a, $b) {
		return count(explode('.', $b)) - count(explode('.', $a));
	});
	
	$entityList = get_entity_list($list);
	$shortList = get_short_list($list);
	return $content = str_replace($entityList, $shortList, $content);
}

/**
 * 创建树形包结构的json数据文本
 */
function create_structure_json($list, $options) {
	//构造json树的根节点
	$root = array();
	//遍历所有类列表
	foreach($list as $name) {
		//如果当前是实体类
		if (filter_abstract($name)) {
			//对一个类按“.”分隔为包结构的层级数组
			$levels = explode('.', $name);
			//获取数组长度
			$len = count($levels);
			//层级中的最后一项
			$last = $levels[$len - 1];
			//将临时指针指向根节点
			$node = &$root;
			
			//如果不是顶级只有一层的
			if ($len > 0) {
				//从顶级之后的第一层开始遍历包结构
				for ($i = 0; $i < $len; $i++) {
					//当前层级
					//如js.client.Browser遍历到client
					$level = $levels[$i];
					//则这里是js.client
					$sub_level = substr($name, 0, strpos($name, $level) + strlen($level));
					
					if (!isset($node[$level])) {
						//如果该层级是一个包结构
						if (is_package_name($sub_level, $options['baseDir'] . $options['packages'][$levels[0]]['path'])) {
							$node[$level] = array();
							$node = &$node[$level];
						} else {
							$node[$level] = $name;
							break;
						}
					} else {
						$node = &$node[$level];
					}
				}
			}
		}
	}
	
	return $root;
}

function is_package_name($name, $base) {
	$dir = "$base/" . str_replace('.', '/', $name);
	return is_dir($dir) && has_entity_in_dir($dir);
}

function has_entity_in_dir($dir) {
	$d = opendir($dir);
	while($f = readdir($d)) {
		if (strpos($f, '.') !== 0) {
			if (filter_abstract($f)) {
				return true;
			}
		}
	}
	return false;
}

function replace_short_json($content, $list) {
	//return str_replace('"', '', $content);
	
	$short_list = get_short_list($list);
	$search_list = array_map(function ($item) {
		return '/"' . str_replace('.', "\\.", $item) . '"/';
	}, array_filter($list, function ($item) {
		return filter_abstract($item);
	}));
	
	$content = preg_replace($search_list, $short_list, $content);
	
	return $content;
}

/**
 * 解析参数通用接口
 */
function parse_param() {
	return isset($argv) ? parse_cli_param() : parse_http_param();
}

function parse_http_param() {
	$param = array();
	foreach ($_POST as $key => $value) {
		$param[$key] = $value;
	}
	return $param;
}

function parse_cli_param() {
	$param = array();
	for ($i = 1, $len = count($argv); $i < $len; $i += 2) {
		$key = $argv[$i];
		if (strpos($key, '-') === 0) {
			$key = substr($key, 1);
		}
		$param[$key] = $argv[$i + 1];
	}
	
	return $param;
}

function build() {
	$options = parse_param();
	
	$options['packages'] = json_decode($options['packages'], true);
//	var_dump($options['packages']);
	
	//是否使用闭包包装器。0：不使用；1：使用(默认)
	$options['useClosure'] = isset($options['useClosure']) ? intval($options['useClosure']) : 0;
	
	//是否导出依赖。0：不导出；1：自动导出(默认)；
	$options['exportDepend'] = intval($options['exportDepend']);
	
	//导出类型。1：下载(默认)；0：导出到exportPath指定的路径；
	$options['exportType'] = isset($options['exportType']) ? intval($options['exportType']) : 1;
	
	//是否输出控制台内容
	$options['debug'] = intval($options['debug']);
	
	//网站根目录路径
	$options['baseDir'] = $_SERVER['DOCUMENT_ROOT'];
	/*
	//压缩类型。使用的压缩器标识。
	compressType
	*/
	
	require('runtime.php');
	
	//如果至少选择了一个包，则打包结果内容
	if (isset($options['includes']) && count($options['includes'])) {
		$result = merge_file($options);
		
		if ($options['useClosure']) {
			closure_wrap($result, $options);
		}
		
		$appDir = $_SERVER['DOCUMENT_ROOT'] . str_replace('/build/php/build.php', '', $_SERVER['PHP_SELF']);
		
		$tempDir = $appDir . '/temp';
		if (!file_exists($tempDir)) {
			mkdir($tempDir);
		}
		
		if ($options['compressType']) {
			$tempFilename = $tempDir . '/lib-' . time();
			
			file_put_contents($tempFilename, $result);
			
			ContentBuffer::push("temporary file '$tempFilename' created ");
			ContentBuffer::push((file_exists($tempFilename) ? 'success!' : 'fail!') . '<br />');
			
			$javapath = '"' . ($_ENV['JAVA_HOME'] ? str_replace('\\', '/', $_ENV['JAVA_HOME']) . '/bin/' : '') . 'java"';
			$javapath = 'java';
			ob_start();
			ob_implicit_flush(false);
			require('compress-cli-tpl/' . $options['compressType'] . '.tpl.php');
			$cli = ob_get_clean();
			
			exec($cli, $output);
			
			$status = join('<br />', $output);
			ContentBuffer::push("Command Line Text: $cli<br />$status<br />");
			
			$compressedFilename = $tempFilename . '.' . $options['compressType'];
			ContentBuffer::push("compressed file '$compressedFilename' created ");
			ContentBuffer::push((file_exists($compressedFilename) ? 'success!' : 'fail!') . '<br />');
			
			$result = file_get_contents($compressedFilename);
			
			if ($result !== false) {
				unlink($tempFilename);
				unlink($tempFilename . '.' . $options['compressType']);
			}
		}
		
		//如果是下载文件的方式导出
		if ($options['exportType']) {
			header('Content-Type: application/force-download');
			header('Content-Disposition: attachment; filename=lib.js');
			
			echo $result;
		} else {//如果是生成文件的方式导出
			header('Content-type:text/html; charset=utf-8');
			
			//导出路径。
			if ($options['exportPath'] == '') {
				$options['exportPath'] = 'yourlib-' . time() . '.js';
			}
			
//			$options['exportPath'] = $options['exportPath'];
			
			file_put_contents($_SERVER['DOCUMENT_ROOT'] . $options['exportPath'], $result);
			
			$downloadPath = $options['exportPath'];
			
			ContentBuffer::push("<a href='$downloadPath'>Download export file</a><br />");
			
			ContentBuffer::push("<br /><b>Build Done!</b>");
			
			if ($options['debug']) {
				ContentBuffer::output();
			}
		}
	} else {
		
	}
}

build();
?>