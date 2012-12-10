<?php
require_once('function.inc.php');

function get_class_tree($paths) {
	$root = null;
	foreach ($paths as $path) {
		dir_dfs(get_lib_path($path), function ($file) use (&$root, $path) {
			if (is_dir($file) || substr($file, -3) == '.js') {
				add_to_tree($root, $file, $path);
			}
		});
	}
	return $root;
}

function add_to_tree(&$tree, $file, $path) {
	$level = find_level($file, $path);
//	var_dump($level);
//	echo "<br />";
	if ($level !== false) {
		$len = count($level);
		$node = null;
		$nodeList = null;
		for ($i = 0; $i < $len; $i++) {
			$cur = $level[$i];
			if (isset($nodeList)) {
				$node = &$nodeList[$cur];
			} else {
				$node = &$tree;
			}
			
			if (!isset($node)) {
				$node = array(
					//'instance' => $cur,
					'children' => array(),
					'dependency' => array()
				);
			}
			$nodeList = &$node['children'];
			
		}
		
		$isInstance = !is_dir($file);
		$node['type'] = $isInstance ? 'instance' : 'package';
		if ($isInstance) {
			$content = file_get_contents($file);
			$depend = get_dependency($content);
			foreach ($depend as $item) {
				array_push($node['dependency'], $item);
			}
			$node['info'] = parse_source_head_info($content);
		}
		
	}
}

function get_dependency($content) {
	$depend = array();
	if (preg_match_all("/(\/{3}import ([\w\.~-]+);?)\b/", $content, $matches, PREG_SET_ORDER)) {
		foreach($matches as $token) {
			$depend[] = $token[2];
		}
	}
	return $depend;
}

function find_level($file, $path) {
	$base = get_lib_path($path);
	$pos = strlen($base);
	$len = strlen($file);
	if (substr($file, -3) == '.js') {
		$len -= 3;
	}
	$relPath = substr($file, $pos, $len - $pos);
	return $relPath ? explode('/', $relPath) : false;
}

function get_lib_path($path) {
	return $_SERVER["DOCUMENT_ROOT"] . $path;
	/*
	$requestURI = $_SERVER["DOCUMENT_ROOT"] . $_SERVER['REQUEST_URI'];
	$pos = strrpos($requestURI, '/') + 1;
	substr($requestURI, 0, $pos);
	*/
}

function get_class_list_json() {
	header("Content-type: text/plain; charset=utf-8");
	$tree = get_class_tree($_GET['trunk']);
	//print_r($tree);
	echo(json_encode($tree));
}

get_class_list_json();
?>