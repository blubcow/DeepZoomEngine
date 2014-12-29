#pragma strict

var level = 0;
var globalScale:float = 1;
var scaleStep:float = 0.02;

function Start()
{
		
	/*
	this.transform.localScale = new Vector3(4,0.5,4);
	
	
	var cube:GameObject  = GameObject.CreatePrimitive(PrimitiveType.Cube);
	cube.transform.position = Vector3(0, 2, 0);
	cube.transform.localScale = new Vector3(1,1,1);
	cube.transform.SetParent(this.transform);
	*/
}

function Update()
{
	globalScale += scaleStep;
	this.transform.localScale += Vector3(scaleStep, scaleStep, scaleStep);
}