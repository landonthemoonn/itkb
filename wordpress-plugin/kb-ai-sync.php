<?php
/**
 * Plugin Name: IT Knowledge Base AI Sync
 * Description: Syncs KB articles to an external AI service for indexing.
 * Version: 1.0.0
 * Author: IT Team
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the Knowledge Base Article Custom Post Type.
 */
function kb_register_post_type() {
	$labels = array(
		'name'               => _x( 'KB Articles', 'post type general name' ),
		'singular_name'      => _x( 'KB Article', 'post type singular name' ),
		'menu_name'          => _x( 'Knowledge Base', 'admin menu' ),
		'name_admin_bar'     => _x( 'KB Article', 'add new on admin bar' ),
		'add_new'            => _x( 'Add New', 'kb_article' ),
		'add_new_item'       => __( 'Add New KB Article' ),
		'new_item'           => __( 'New KB Article' ),
		'edit_item'          => __( 'Edit KB Article' ),
		'view_item'          => __( 'View KB Article' ),
		'all_items'          => __( 'All KB Articles' ),
		'search_items'       => __( 'Search KB Articles' ),
		'parent_item_colon'  => __( 'Parent KB Articles:' ),
		'not_found'          => __( 'No KB articles found.' ),
		'not_found_in_trash' => __( 'No KB articles found in Trash.' )
	);

	$args = array(
		'labels'             => $labels,
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'kb' ),
		'capability_type'    => 'post',
		'has_archive'        => true,
		'hierarchical'       => false,
		'menu_position'      => 5,
		'supports'           => array( 'title', 'editor', 'author', 'custom-fields', 'revisions' ),
		'show_in_rest'       => true, // Enable Gutenberg and REST API
	);

	register_post_type( 'kb_article', $args );
}
add_action( 'init', 'kb_register_post_type' );

/**
 * Register Custom Taxonomies for Knowledge Base.
 */
function kb_register_taxonomies() {
	// Systems Taxonomy
	$labels_systems = array(
		'name'              => _x( 'Systems', 'taxonomy general name' ),
		'singular_name'     => _x( 'System', 'taxonomy singular name' ),
		'search_items'      => __( 'Search Systems' ),
		'all_items'         => __( 'All Systems' ),
		'parent_item'       => __( 'Parent System' ),
		'parent_item_colon' => __( 'Parent System:' ),
		'edit_item'         => __( 'Edit System' ),
		'update_item'       => __( 'Update System' ),
		'add_new_item'      => __( 'Add New System' ),
		'new_item_name'     => __( 'New System Name' ),
		'menu_name'         => __( 'Systems' ),
	);

	$args_systems = array(
		'hierarchical'      => true,
		'labels'            => $labels_systems,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => 'kb-system' ),
		'show_in_rest'      => true,
	);

	register_taxonomy( 'kb_systems', array( 'kb_article' ), $args_systems );

	// Tags Taxonomy
	$labels_tags = array(
		'name'                       => _x( 'KB Tags', 'taxonomy general name' ),
		'singular_name'              => _x( 'KB Tag', 'taxonomy singular name' ),
		'search_items'               => __( 'Search KB Tags' ),
		'popular_items'              => __( 'Popular KB Tags' ),
		'all_items'                  => __( 'All KB Tags' ),
		'parent_item'                => null,
		'parent_item_colon'          => null,
		'edit_item'                  => __( 'Edit KB Tag' ),
		'update_item'                => __( 'Update KB Tag' ),
		'add_new_item'               => __( 'Add New KB Tag' ),
		'new_item_name'              => __( 'New KB Tag Name' ),
		'separate_items_with_commas' => __( 'Separate tags with commas' ),
		'add_or_remove_items'        => __( 'Add or remove tags' ),
		'choose_from_most_used'      => __( 'Choose from the most used tags' ),
		'not_found'                  => __( 'No tags found.' ),
		'menu_name'                  => __( 'KB Tags' ),
	);

	$args_tags = array(
		'hierarchical'          => false,
		'labels'                => $labels_tags,
		'show_ui'               => true,
		'show_admin_column'     => true,
		'update_count_callback' => '_update_post_term_count',
		'query_var'             => true,
		'rewrite'               => array( 'slug' => 'kb-tag' ),
		'show_in_rest'          => true,
	);

	register_taxonomy( 'kb_tags', array( 'kb_article' ), $args_tags );
}
add_action( 'init', 'kb_register_taxonomies' );

/**
 * Register the IT Admin role and capability.
 */
function kb_register_roles() {
	add_role( 'it_admin', 'IT Admin', array(
		'read'                       => true,
		'view_internal_kb'           => true, // Custom capability
		'read_internal_diagnostics'  => true, // New custom capability
	) );

	// Also give the capabilities to administrators
	$admin = get_role( 'administrator' );
	if ( $admin ) {
		$admin->add_cap( 'view_internal_kb' );
		$admin->add_cap( 'read_internal_diagnostics' );
	}
}
register_activation_hook( __FILE__, 'kb_register_roles' );

/**
 * Filter the content of KB articles to conditionally show internal fields.
 */
function kb_render_article_content( $content ) {
	if ( ! is_singular( 'kb_article' ) ) {
		return $content;
	}

	$post_id  = get_the_ID();
	$is_admin = current_user_can( 'administrator' );
	
	// Employee Safe Content
	$summary    = get_post_meta( $post_id, 'kb_employee_summary', true );
	$steps      = get_post_meta( $post_id, 'kb_employee_steps', true );
	$escalation = get_post_meta( $post_id, 'kb_employee_escalation', true );
	
	$new_content = '<div class="kb-article-container">';
	
	if ( ! empty( $summary ) ) {
		$new_content .= '<div class="kb-section kb-employee-summary">';
		$new_content .= '<h3>Summary</h3>' . wpautop( $summary );
		$new_content .= '</div>';
	}

	if ( ! empty( $steps ) ) {
		$new_content .= '<div class="kb-section kb-employee-steps">';
		$new_content .= '<h3>Steps</h3>' . wpautop( $steps );
		$new_content .= '</div>';
	}

	if ( ! empty( $escalation ) ) {
		$new_content .= '<div class="kb-section kb-employee-escalation" style="background:#f0f7ff; padding:15px; border-left:4px solid #0073aa; margin-top:20px;">';
		$new_content .= '<strong>Escalation Guidance:</strong> ' . esc_html( $escalation );
		$new_content .= '</div>';
	}

	// For non-admin users, we only show the employee-safe fields above.
	// Administrators can see the original editor content as well.
	if ( $is_admin ) {
		$new_content .= '<div class="kb-section kb-main-content" style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px;">';
		$new_content .= '<h3>Original Content (Admin Only)</h3>' . $content . '</div>';
	}

	// Check for IT Admin permissions
	if ( current_user_can( 'view_internal_kb' ) ) {
		$new_content .= '<div class="kb-internal-only" style="background:#fff4f4; border:2px solid #d63638; padding:20px; margin-top:40px;">';
		$new_content .= '<h3 style="color:#d63638; margin-top:0;">INTERNAL IT DATA (Restricted)</h3>';

		// Diagnostics and Remediation require 'read_internal_diagnostics'
		if ( current_user_can( 'read_internal_diagnostics' ) ) {
			$diagnostics = get_post_meta( $post_id, 'kb_internal_diagnostics', true );
			$remediation = get_post_meta( $post_id, 'kb_internal_remediation', true );

			if ( ! empty( $diagnostics ) ) {
				$new_content .= '<div class="kb-internal-section"><h4>Diagnostics</h4>' . wpautop( $diagnostics ) . '</div>';
			}

			if ( ! empty( $remediation ) ) {
				$new_content .= '<div class="kb-internal-section"><h4>Remediation</h4>' . wpautop( $remediation ) . '</div>';
			}
		} else {
			$new_content .= '<p><em>Additional technical diagnostics are restricted.</em></p>';
		}

		$admin_links = get_post_meta( $post_id, 'kb_internal_admin_links', true );
		if ( ! empty( $admin_links ) ) {
			$new_content .= '<div class="kb-internal-section"><h4>Admin Links</h4>' . wpautop( $admin_links ) . '</div>';
		}

		$new_content .= '</div>';
	}

	$new_content .= '</div>';

	return $new_content;
}
add_filter( 'the_content', 'kb_render_article_content' );

/**
 * Register ACF Field Groups for Knowledge Base Articles.
 */
function kb_register_acf_fields() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group( array(
		'key'    => 'group_kb_article_fields',
		'title'  => 'Knowledge Base Article Details',
		'fields' => array(
			// Employee Facing Section
			array(
				'key'   => 'field_kb_employee_tab',
				'label' => 'Employee Facing (Public)',
				'type'  => 'tab',
			),
			array(
				'key'          => 'field_kb_employee_summary',
				'label'        => 'Employee Summary',
				'name'         => 'kb_employee_summary',
				'type'         => 'wysiwyg',
				'instructions' => 'A high-level overview for employees.',
				'toolbar'      => 'basic',
				'media_upload' => 0,
			),
			array(
				'key'          => 'field_kb_employee_steps',
				'label'        => 'Employee Steps',
				'name'         => 'kb_employee_steps',
				'type'         => 'wysiwyg',
				'instructions' => 'Step-by-step instructions for employees.',
				'toolbar'      => 'basic',
				'media_upload' => 0,
			),
			array(
				'key'          => 'field_kb_employee_escalation',
				'label'        => 'Escalation Guidance',
				'name'         => 'kb_employee_escalation',
				'type'         => 'textarea',
				'instructions' => 'Who should the employee contact if this doesn\'t work?',
				'rows'         => 3,
			),

			// Internal IT Section
			array(
				'key'   => 'field_kb_internal_tab',
				'label' => 'Internal IT (Protected)',
				'type'  => 'tab',
			),
			array(
				'key'          => 'field_kb_internal_diagnostics',
				'label'        => 'Internal Diagnostics',
				'name'         => 'kb_internal_diagnostics',
				'type'         => 'wysiwyg',
				'instructions' => 'Technical diagnostic steps, log locations, etc.',
			),
			array(
				'key'          => 'field_kb_internal_remediation',
				'label'        => 'Remediation Steps',
				'name'         => 'kb_internal_remediation',
				'type'         => 'wysiwyg',
				'instructions' => 'Privileged steps to fix the issue (scripts, admin commands).',
			),
			array(
				'key'          => 'field_kb_internal_admin_links',
				'label'        => 'Admin Links',
				'name'         => 'kb_internal_admin_links',
				'type'         => 'wysiwyg',
				'instructions' => 'Links to internal admin portals or documentation.',
				'toolbar'      => 'basic',
				'media_upload' => 0,
			),

			// Metadata Section
			array(
				'key'   => 'field_kb_metadata_tab',
				'label' => 'Metadata',
				'type'  => 'tab',
			),
			array(
				'key'          => 'field_kb_review_date',
				'label'        => 'Last Reviewed Date',
				'name'         => 'kb_review_date',
				'type'         => 'date_picker',
				'display_format' => 'F j, Y',
				'return_format'  => 'Y-m-d',
			),
		),
		'location' => array(
			array(
				array(
					'param'    => 'post_type',
					'operator' => '==',
					'value'    => 'kb_article',
				),
			),
		),
		'menu_order'            => 0,
		'position'              => 'normal',
		'style'                 => 'default',
		'label_placement'       => 'top',
		'instruction_placement' => 'label',
		'hide_on_screen'        => '',
		'active'                => true,
		'description'           => '',
	) );
}
add_action( 'acf/init', 'kb_register_acf_fields' );

/**
 * Trigger AI re-indexing when a KB article is saved or updated.
 */
function kb_ai_sync_on_save( $post_id, $post, $update ) {
	// Only process our custom post type
	if ( 'kb_article' !== $post->post_type ) {
		return;
	}

	// Skip autosaves, revisions, and bulk edits
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( 'publish' !== $post->post_status ) {
		return;
	}

	// Gather Article Data
	// Assuming ACF is used for structured fields
	$article_data = array(
		'id'        => $post_id,
		'title'     => get_the_title( $post_id ),
		'slug'      => $post->post_name,
		'metadata'  => array(
			'last_reviewed'    => get_post_meta( $post_id, 'kb_review_date', true ),
			'systems'          => wp_get_post_terms( $post_id, 'kb_systems', array( 'fields' => 'names' ) ),
			'tags'             => wp_get_post_terms( $post_id, 'kb_tags', array( 'fields' => 'names' ) ),
			'owner'            => get_the_author_meta( 'display_name', $post->post_author ),
			'updated_at'       => $post->post_modified_gmt,
			'source_url'       => get_permalink( $post_id ),
		),
		'content'   => array(
			'employee' => array(
				'summary'    => get_post_meta( $post_id, 'kb_employee_summary', true ),
				'steps'      => get_post_meta( $post_id, 'kb_employee_steps', true ), // Assuming structured data
				'escalation' => get_post_meta( $post_id, 'kb_employee_escalation', true ),
			),
			'internal' => array(
				'diagnostics' => get_post_meta( $post_id, 'kb_internal_diagnostics', true ),
				'remediation' => get_post_meta( $post_id, 'kb_internal_remediation', true ),
				'admin_links' => get_post_meta( $post_id, 'kb_internal_admin_links', true ),
			),
		),
	);

	// Send to External AI Service
	// Replace with your actual AI Service URL (e.g., the Node.js app URL)
	$ai_service_url = get_option( 'kb_ai_service_endpoint', 'https://ais-dev-uczh4ahzesk2ujbs2wyncu-23217544913.us-west1.run.app/api/index' );

	$response = wp_remote_post( $ai_service_url, array(
		'method'      => 'POST',
		'timeout'     => 45,
		'redirection' => 5,
		'httpversion' => '1.0',
		'blocking'    => true, // Set to false if you want it to be asynchronous and don't care about the result
		'headers'     => array(
			'Content-Type' => 'application/json',
			'X-KB-Sync-Key' => get_option( 'kb_ai_sync_secret_key' ),
		),
		'body'        => json_encode( $article_data ),
		'cookies'     => array(),
	) );

	if ( is_wp_error( $response ) ) {
		error_log( 'KB AI Sync Error: ' . $response->get_error_message() );
	} else {
		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			error_log( 'KB AI Sync Failed with status: ' . $status_code );
		}
	}
}
add_action( 'save_post_kb_article', 'kb_ai_sync_on_save', 10, 3 );
