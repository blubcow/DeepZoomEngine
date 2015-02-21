#pragma strict

var scaleStep:float = 1.02;
var startDeepObject:GameObject;
var keepLevels:int = 3;
var keepHiddenLevels:int = 6;
var currentLevel:int = 0;
var centerObject:GameObject;
var splitDistance:float = 1;

private var scaleMultiplier:int = 1000000;
private var target:GameObject;
private var centerChild:GameObject;

public class Support
{
	public static function removeFromArray(arr:Array, val)
	{
		var index = -1;
		for (var i = 0; i < arr.length; ++i)
	    	if(arr[i] == val) index = i;
	    
	    if(index != -1){
	    	arr.splice(index,1);
	    }
	}
	
	public static function minKey(valArray:Array):int
	{
	     var min:float = -1;
	     var key:int = -1;
	     for (var i = 0; i < valArray.length; i++) {
	     	var floatVal:float = parseFloat( valArray[i].ToString() );
	     	if(min == -1){
	     		min = floatVal;
	     		key = i;
	     	}
	        if(floatVal < min) {
	        	min = floatVal;
	        	key = i;
	        }
	     }
	     return key;
	}
}

public class DeepObject
{
    public var gameObject:GameObject;
    public var children = new Array();
    public static var allObjects = new Array();
    public static var prevObjects = new Array();
    public var level:int;
    public var game:Game;
    public var inPrev = false;
    public var centerGameObj:GameObject;
    public var centerPos:Vector3 = new Vector3(0,0,0);
    
    public function DeepObject(g:Game, gO:GameObject, l:int)
    {
    	gameObject = gO;
    	level = l;
    	game = g;
    	allObjects.push( this );
    }
    
    public function toPrev()
    {
    	if(!inPrev){
    		inPrev = true;
    		prevObjects.push(this);
    		Support.removeFromArray(allObjects, this);
		}
		gameObject.SetActive(false);
    }
    
    public function toCurrent()
    {
    	if(inPrev){
    		inPrev = false;
    		allObjects.push(this);
    		Support.removeFromArray(prevObjects, this);
    	}
    	gameObject.SetActive(true);
    	checkActive();
    }
    
    public function checkActive()
    {
    	var checkPos:Vector3 = gameObject.transform.position + (gameObject.transform.lossyScale.x * centerPos);
	    
	    if( (Vector3.Distance(checkPos, game.centerObject.transform.position) < game.splitDistance) ||
    		(children.length > 0))
    	{
    		if(level < game.currentLevel){
	    		gameObject.SetActive(false);
	    	}
	    	
	    	//
		    for (var i = 0; i < children.length; ++i)
	    	{
	    		var castChildObj:DeepObject = children[i] as DeepObject;
	    		castChildObj.checkActive();
	    	}
    	}
    }
    
    public function setCenter(c:GameObject)
    {
    	centerGameObj = c;
    }
    
    public function setCenterPos(c:Vector3)
    {
    	centerPos = c;
    }
    
    public function convertChild(i:int)
    {
    	return gameObject.GetComponent.<DeepAttributes>().childCubePrefab;
    }
    
    public function addChild(dO:DeepObject)
    {
    	children.push(dO);
    }
    
    public function destroyAsRoot()
    {
    	var castChildObj:DeepObject;
    	for(var k=(children.length-1); k>=0; k--)
    	{
	    	castChildObj = children[k] as DeepObject;
	    	if(	(castChildObj.children.length == 0) && 
	    		(Vector3.Distance(castChildObj.gameObject.transform.position, game.centerObject.transform.position) > game.splitDistance))
	    	{
	    		castChildObj.destroySelf();
	    		Support.removeFromArray(children, castChildObj);
	    	}
	    }
	    destroySelf();
    }
    
    public function destroySelf()
    {
    	Support.removeFromArray(DeepObject.allObjects, this);
    	Support.removeFromArray(DeepObject.prevObjects, this);
    	gameObject.Destroy(gameObject);
    	game = null;
    }
    
    public function destroyChildren()
    {
    	for (var i = 0; i < children.length; ++i)
    	{
    		var castChildObj:DeepObject = children[i] as DeepObject;
    		castChildObj.destroy();
    	}
    	children = new Array();
    }
    
    private function destroy()
    {
    	destroyChildren();
		destroySelf();
    }
}

function Start()
{
	target = new GameObject();
	target.transform.localScale *= scaleMultiplier;
    var child = Instantiate(startDeepObject, Vector3(0, 0, 0), Quaternion.identity);
	child.transform.parent = target.transform;
	new DeepObject(this, child, currentLevel);
	unSplitRootObjects();
}

function Update()
{	
	zoomGame(scaleStep);
	
	// input controls
	if (Input.GetKey(KeyCode.UpArrow))
    {
    	//zoomGame(scaleStep);
    	Camera.main.transform.Translate(Vector3.down*0.05);
    }
    if (Input.GetKey(KeyCode.DownArrow))
    {
    	//zoomGame(1/scaleStep);
    	Camera.main.transform.Translate(Vector3.up*0.05);
    }
    if (Input.GetKey(KeyCode.LeftArrow))
    {
    	Camera.main.transform.Translate(Vector3.right*0.05);
    }
    if (Input.GetKey(KeyCode.RightArrow))
    {
    	Camera.main.transform.Translate(Vector3.left*0.05);
    }
    Camera.main.transform.LookAt(centerObject.transform);
    
    // CENTER
    // reset center
    if(centerChild){
	    if(centerObject.transform.position != centerChild.transform.position)
	    {
	    	var leftPosition = target.transform.position - centerChild.transform.position;
	    	target.transform.Translate((leftPosition/10), Space.World);
	    	
	    	// lose
	    	if(Vector3.Distance(centerObject.transform.position, centerChild.transform.position) < 0.001){
	    		centerChild = null;
	    	}
	    }
    }
    
    // active objects (allObjects)
    var hideObjects = new Array();
    var prevCurrentLevel = currentLevel;
    for(var i = 0; i < DeepObject.allObjects.length; ++i)
    {
    	var castObject:DeepObject = DeepObject.allObjects[i] as DeepObject;
    	
    	// ZOOM IN - show inside
    	if(	(castObject.gameObject.activeSelf == true) &&
    		(castObject.gameObject.transform.lossyScale.x > 1) && 
	    	(Vector3.Distance(castObject.gameObject.transform.position, centerObject.transform.position) < splitDistance))
	    {
	    	splitDeepObject(castObject);
	    	
	    	// set current level
			if(castObject.level >= currentLevel){
				currentLevel = castObject.level + 1;
				//Debug.Log('IN current: '+currentLevel);
			}
	    }
	    
    	// ZOOM OUT - hide inside
    	if(	(castObject.gameObject.activeSelf == false) && 
    		(castObject.gameObject.transform.lossyScale.x < 1))
	    {
	    	castObject.destroyChildren();
	    	castObject.gameObject.SetActive(true);
	    	
	    	// set back to center
	    	if(castObject.centerGameObj){
	    	
	    		//Debug.Log(castObject.centerGameObj.transform.localPosition);
	    		//target.transform.Translate(castObject.centerGameObj.transform.localPosition, Space.World);
	    		
	    		centerChild = castObject.gameObject;
	    		
	    	}
	    	
	    	// set current level
			if(castObject.level < currentLevel){
				currentLevel = castObject.level;
				//Debug.Log('OUT current: '+currentLevel);
			}
	    }
	    
    	// ZOOM IN - hide outside
    	if(castObject.level <= (prevCurrentLevel-keepLevels)){
    		hideObjects.push(castObject);
    	}
    }
    
    // ZOOM OUT - show outside
    if(currentLevel < prevCurrentLevel)
    {
    	unSplitRootObjects();
    }
    
    // ZOOM IN - hide outside
    for(var j = 0; j < hideObjects.length; ++j)
    {
    	var castHideObj:DeepObject = hideObjects[j] as DeepObject;
    	castHideObj.toPrev();
    }
    
    // ZOOM IN - destroy outside
    for(var l=(DeepObject.prevObjects.length-1); l>=0; l--)
    {
    	var castPrevObject:DeepObject = DeepObject.prevObjects[l] as DeepObject;
    	if(castPrevObject.level < (prevCurrentLevel-keepHiddenLevels)){
    		castPrevObject.destroyAsRoot();
    	}
    }
}

function zoomGame(scaleStep:float)
{
	target.transform.localScale *= scaleStep;
	
	Debug.Log(target.transform.localScale);
	
	//min
	if(	(target.transform.localScale.x < 1) ||
		(target.transform.localScale.x > (scaleMultiplier*scaleMultiplier)))
	{
		
		var emptyObj:GameObject = new GameObject();
		emptyObj.transform.localScale = Vector3(scaleMultiplier,scaleMultiplier,scaleMultiplier);
		
		for(var i=0; i<DeepObject.allObjects.length; i++){
	    	var castObj:DeepObject = DeepObject.allObjects[i] as DeepObject;
	    	castObj.gameObject.transform.parent = emptyObj.transform;
	    }
	    for(var j=0; j<DeepObject.prevObjects.length; j++){
	    	var castPrevObj:DeepObject = DeepObject.prevObjects[j] as DeepObject;
	    	castPrevObj.gameObject.transform.parent = emptyObj.transform;
	    }
	    
	    target.Destroy(target);
	    target = emptyObj;
	}
}

var count = 0;
function unSplitRootObjects()
{
	count++;
	var unsplitLevel = (currentLevel-keepLevels);
	for(var level=currentLevel; level>=unsplitLevel; level--)
	{
		var levelFound = false;
		
		// first try find level in visible objects
		for(var i=0; i<DeepObject.allObjects.length; i++){
	    	var castObj:DeepObject = DeepObject.allObjects[i] as DeepObject;
	    	if(castObj.level == level){
	    		levelFound = true;
	    		// Debug.Log('CHECKED VISIBLE LEVEL: '+level+', current: '+currentLevel);
	    		break;
	    	}	
	    }
		
		// then try find level in hidden objects
		if(!levelFound){
			for(var j=(DeepObject.prevObjects.length-1); j>=0; j--){
		    	var castPrevObj:DeepObject = DeepObject.prevObjects[j] as DeepObject;
		    	if(castPrevObj.level == level){
		    		levelFound = true;
		    		Debug.Log(count+' SHOW HIDDEN LEVEL: '+level+', current: '+currentLevel);
		    		castPrevObj.toCurrent();
		    	}	
		    }
	    }
			
		// else create root
		if(!levelFound){
			Debug.Log(count+' CREATE NEW ROOT LEVEL: '+level+', current: '+currentLevel);
			unSplitLevel(level);
		}
	}
}

function unSplitLevel(level:int)
{
	var unsplitLevel = level;
	var rootLevel = unsplitLevel+1;
        
    // get root object
    var rootObj:DeepObject;
    for(var j = 0; j < DeepObject.allObjects.length; ++j)
    {
    	var castRootObj:DeepObject = DeepObject.allObjects[j] as DeepObject;
    	if(castRootObj.level <= rootLevel){
    		rootObj = castRootObj;
    	}
    }
    
    if(rootObj){
	    // make parent object
	    var parentPrefab = Instantiate(startDeepObject, Vector3(0,0,0), Quaternion.identity);
	    var childTransform:Transform = parentPrefab.transform.GetChild(0).transform;
	    
	    parentPrefab.transform.localScale = (Vector3(1,1,1) / childTransform.localScale.x) * rootObj.gameObject.transform.lossyScale.x;
	    parentPrefab.transform.parent = target.transform;
	    
	    //parentPrefab.transform.position = rootObj.gameObject.transform.position - (childTransform.localPosition * (1/rootObj.gameObject.transform.lossyScale.x));
	    parentPrefab.transform.position = rootObj.gameObject.transform.position - (childTransform.localPosition * parentPrefab.transform.lossyScale.x);
	    
	          
	    // add to array and parent obj
	    var parentObj = new DeepObject(this, parentPrefab, unsplitLevel);
	    parentObj.addChild(rootObj);
	    
	    // set center
		parentObj.setCenter(rootObj.gameObject);
		parentObj.setCenterPos(rootObj.gameObject.transform.position);
	    
	    // create other children too
	    var numChildren = parentPrefab.transform.childCount;
		for (var k=1; k<numChildren; ++k)
		{
		   	childTransform = parentPrefab.transform.GetChild(k).transform;
		   	
		   	// TODO
		   	// get prefab from component variable
		   	// child.GetComponent.<LodObject>().setController(gameObject);
		   	var deepObject = parentObj.convertChild(k);
		  	var childPrefab = Instantiate(deepObject, childTransform.position, Quaternion.identity);
		       
		    childPrefab.transform.localScale = childTransform.localScale * parentPrefab.transform.lossyScale.x;
		    childPrefab.transform.parent = target.transform;
		       
		    // add to array and parent obj
		    var childObj = new DeepObject(this, childPrefab, rootLevel);
		   	parentObj.addChild(childObj);
		}
		
		// check active
		parentObj.checkActive();
	}
}

function splitDeepObject(obj:DeepObject)
{
	/**
	* CONVERT ALL CHILDREN INTO NEW PREFABS (DEEP GAME OBJECTS)
	*/
	var numChildren = obj.gameObject.transform.childCount;
	var childDistances = new Array();
	if(obj.children.length == 0)
	{
	    for (var i = 0; i < numChildren; ++i)
	    {
	    	var childTransform = obj.gameObject.transform.GetChild(i).transform;
	    	
	    	// TODO
	    	// get prefab from component variable
	    	// child.GetComponent.<LodObject>().setController(gameObject);
	    	
	    	var deepObject = obj.convertChild(i);
	    	
	    	var childPrefab:GameObject = Instantiate(deepObject, childTransform.position, Quaternion.identity);
	        
	        childPrefab.transform.localScale = childTransform.localScale;
	        childPrefab.transform.parent = target.transform;
	        
	        // add to array and parent obj
	        var childObj = new DeepObject(this, childPrefab, obj.level+1);
	    	obj.addChild( childObj );
	    	
	    	// add to distances
	    	childDistances[i] = Vector3.Distance(childPrefab.transform.position, Camera.main.transform.position);
		}
		
		// set center near camera
		var key:int = Support.minKey(childDistances);
		centerChild = obj.gameObject.transform.GetChild(key).gameObject;
		obj.setCenter(centerChild);
		obj.setCenterPos(centerChild.transform.position);
	}
	
	// hide object
	obj.gameObject.SetActive(false);
}