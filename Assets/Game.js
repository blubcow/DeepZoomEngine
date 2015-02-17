#pragma strict

var scaleStep:float = 0.02;
var centerPosition:Vector3;
var startDeepObject:GameObject;

var deepObjects = new Array();

public class DeepObject
{
    public var gameObject:GameObject;
    public var level:float;
    public var scaleRatio:float;
    
    public function DeepObject(gO:GameObject)
    {
    	gameObject = gO;
    	level = gameObject.transform.localScale.x;
    	scaleRatio = level;
    }
}

function Start()
{
    
    var child = Instantiate(startDeepObject, Vector3(0, 0, 0), Quaternion.identity);
	
	child.transform.parent = transform;
	
	deepObjects.push( new DeepObject(child) );
	
}

function Update()
{
	if (Input.GetKey(KeyCode.UpArrow))
    {
           zoomGame(scaleStep);
    }
    if (Input.GetKey(KeyCode.DownArrow))
    {
            zoomGame(-scaleStep);
    }
    
    // check deep object levels
    for (var i = 0; i < deepObjects.length; ++i)
    {
    	var castObject:DeepObject = deepObjects[i];
    	if(castObject.level > 1){
    		splitDeepObject(deepObjects[i]);
    	}
    }
    
}

function splitDeepObject(obj:DeepObject)
{
	/**
	* CONVERT ALL CHILDREN INTO NEW PREFABS (DEEP GAME OBJECTS) TODO
	*/
	var numChildren = obj.gameObject.transform.childCount;
 
    for (var i = 0; i < numChildren; ++i)
    {
    	var childTransform = obj.gameObject.transform.GetChild(i).transform;
    	var child = Instantiate(startDeepObject, Vector3(childTransform.position.x, childTransform.position.y, childTransform.position.z), Quaternion.identity);
        
        child.transform.localScale = childTransform.localScale;
        child.transform.parent = transform;
        
    	deepObjects.push( new DeepObject(child) );
       	/*
            // Debug.Log(transform.GetChild(i));
            var childTransform = transform.GetChild(i).transform;
            
            var child = Instantiate(lod0Object, Vector3(childTransform.position.x, childTransform.position.y, childTransform.position.z), Quaternion.identity);
            
            //for (var j = 0; j <= level; ++j)
        	//{
        		var newScale = 1 - Mathf.Pow(0.2, (level+1));
            	child.transform.localScale -= Vector3(newScale, newScale, newScale);
            //}
            
            // var child = Instantiate(firstObject, Vector3(0, 0, 0), Quaternion.identity);
   			child.GetComponent.<LodObject>().setControllerObject(controller);
   			child.GetComponent.<LodObject>().init( (level+1) );
   			
   			
   			//children.push(child);
   			//controller.addChild(child);*/
    		
            //Destroy(transform.GetChild(i).gameObject);
        //}
        
        //Destroy(gameObject);
        //gameObject.transform
	}
	
	
	removeFromArray(deepObjects, obj);
	//Destroy(obj.gameObject);
}

function removeFromArray(arr:Array, val)
{
	var index = -1;
	for (var i = 0; i < arr.length; ++i)
    	if(arr[i] == val) index = i;
    
    if(index != -1){
    	arr.splice(index,1);
    }
}

function zoomGame(scaleStep:float)
{
	this.transform.localScale += Vector3(scaleStep, scaleStep, scaleStep);
	
	// update level in deepObjects
	for (var i = 0; i < deepObjects.length; ++i)
    {
    	var castObject:DeepObject = deepObjects[i];
    	castObject.level += scaleStep;
    }
}